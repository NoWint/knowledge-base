import type {
  SyncState,
  SyncRecord,
  SyncPullResponse,
  SyncPushResponse,
  SyncStatusResponse,
  ConflictResolution,
  ConflictResolutionStrategy,
} from './types'
import { syncQueue } from './sync-queue'
import { defaultConflictResolver, ConflictResolver } from './conflict-resolver'
import { db } from '@/lib/db/database'
import { useUserStore } from '@/store/user-store'

const API_BASE_URL = process.env.NEXT_PUBLIC_SYNC_API_URL || '/api/sync'

const SYNC_INTERVAL = 30000
const MAX_PUSH_BATCH = 50

type SyncListener = (state: SyncState) => void

class SyncService {
  private state: SyncState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    lastSyncTimestamp: null,
    pendingCount: 0,
    conflictedCount: 0,
    currentError: null,
  }

  private listeners: Set<SyncListener> = new Set()
  private syncInterval: ReturnType<typeof setInterval> | null = null
  private conflictResolver: ConflictResolver

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline())
      window.addEventListener('offline', () => this.handleOffline())
    }
    this.conflictResolver = defaultConflictResolver
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    this.listeners.forEach(listener => listener({ ...this.state }))
  }

  private updateState(partial: Partial<SyncState>): void {
    this.state = { ...this.state, ...partial }
    this.notify()
  }

  private async handleOnline(): Promise<void> {
    this.updateState({ isOnline: true })
    await this.syncNow()
  }

  private handleOffline(): void {
    this.updateState({ isOnline: false })
  }

  async initialize(): Promise<void> {
    if (typeof window === 'undefined') return

    const pendingCount = await syncQueue.getPendingCount()
    const conflictedCount = await syncQueue.getConflictedCount()
    const lastSync = await syncQueue.getLastSyncTimestamp()

    this.updateState({
      pendingCount,
      conflictedCount,
      lastSyncTimestamp: lastSync || null,
    })

    this.startPeriodicSync()
  }

  startPeriodicSync(interval: number = SYNC_INTERVAL): void {
    this.stopPeriodicSync()
    this.syncInterval = setInterval(() => {
      if (this.state.isOnline && !this.state.isSyncing) {
        this.syncNow()
      }
    }, interval)
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  async syncNow(): Promise<void> {
    if (this.state.isSyncing || !this.state.isOnline) {
      return
    }

    this.updateState({ isSyncing: true, currentError: null })

    try {
      await this.pushChanges()
      await this.pullChanges()
      await this.resolveAllConflicts()

      const pendingCount = await syncQueue.getPendingCount()
      const conflictedCount = await syncQueue.getConflictedCount()

      this.updateState({
        isSyncing: false,
        pendingCount,
        conflictedCount,
        lastSyncTimestamp: Date.now(),
      })

      await syncQueue.setLastSyncTimestamp(Date.now())
    } catch (error) {
      console.error('Sync failed:', error)
      this.updateState({
        isSyncing: false,
        currentError: error instanceof Error ? error.message : '同步失败',
      })
    }
  }

  async pushChanges(): Promise<SyncPushResponse | null> {
    const records = await syncQueue.getPendingRecords(MAX_PUSH_BATCH)
    if (records.length === 0) return null

    const userStore = useUserStore.getState()
    if (!userStore.currentUser) {
      console.warn('No user logged in, skipping push')
      return null
    }

    for (const record of records) {
      await syncQueue.updateRecordStatus(record.id, 'syncing')
    }

    try {
      const response = await fetch(`${API_BASE_URL}/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userStore.currentUser.id,
          'X-Device-Id': syncQueue.getDeviceId(),
        },
        body: JSON.stringify({ records }),
      })

      if (!response.ok) {
        throw new Error(`Push failed: ${response.status}`)
      }

      const result: SyncPushResponse = await response.json()

      const successIds: string[] = []
      for (const record of records) {
        const hasConflict = result.conflicts.some(c => c.recordId === record.id)
        if (hasConflict) {
          const conflict = result.conflicts.find(c => c.recordId === record.id)
          await syncQueue.updateRecordStatus(
            record.id,
            'conflict',
            undefined,
            conflict?.serverData
          )
        } else {
          successIds.push(record.id)
          await syncQueue.removeRecord(record.id)
        }
      }

      return result
    } catch (error) {
      for (const record of records) {
        await syncQueue.updateRecordStatus(
          record.id,
          'failed',
          error instanceof Error ? error.message : 'Push failed'
        )
      }
      throw error
    }
  }

  async pullChanges(): Promise<SyncPullResponse | null> {
    const userStore = useUserStore.getState()
    if (!userStore.currentUser) {
      return null
    }

    const lastSync = await syncQueue.getLastSyncTimestamp()

    try {
      const response = await fetch(
        `${API_BASE_URL}/pull?since=${lastSync}&userId=${userStore.currentUser.id}`,
        {
          method: 'GET',
          headers: {
            'X-Device-Id': syncQueue.getDeviceId(),
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Pull failed: ${response.status}`)
      }

      const result: SyncPullResponse = await response.json()

      if (result.records.length === 0) {
        return result
      }

      for (const record of result.records) {
        if (record.operation === 'delete') {
          await this.applyServerDelete(record)
        } else {
          await this.applyServerChange(record)
        }
      }

      return result
    } catch (error) {
      console.error('Pull failed:', error)
      throw error
    }
  }

  private async applyServerChange(record: SyncRecord): Promise<void> {
    try {
      const data = record.data || {}

      switch (record.tableName) {
        case 'questions':
          await db.questions.put(data as any)
          break
        case 'userAnswers':
          await db.userAnswers.put(data as any)
          break
        case 'wrongQuestions':
          await db.wrongQuestions.put(data as any)
          break
        case 'learningGoals':
          await db.learningGoals.put(data as any)
          break
        case 'flashCards':
          await db.flashCards.put(data as any)
          break
        case 'userFlashCardReviews':
          await db.userFlashCardReviews.put(data as any)
          break
        case 'dailyStats':
          await db.dailyStats.put(data as any)
          break
        case 'studySessions':
          await db.studySessions.put(data as any)
          break
        case 'userProfiles':
          await db.userProfiles.put(data as any)
          break
        default:
          console.warn(`Table ${record.tableName} sync not implemented`)
      }
    } catch (error) {
      console.error(`Failed to apply server change for ${record.tableName}:`, error)
    }
  }

  private async applyServerDelete(record: SyncRecord): Promise<void> {
    try {
      switch (record.tableName) {
        case 'questions':
          await db.questions.delete(record.recordId)
          break
        case 'userAnswers':
          await db.userAnswers.delete(record.recordId)
          break
        case 'wrongQuestions':
          await db.wrongQuestions.delete(record.recordId)
          break
        case 'learningGoals':
          await db.learningGoals.delete(record.recordId)
          break
        case 'flashCards':
          await db.flashCards.delete(record.recordId)
          break
        case 'userFlashCardReviews':
          await db.userFlashCardReviews.delete(record.recordId)
          break
        case 'dailyStats':
          await db.dailyStats.delete(record.recordId)
          break
        case 'studySessions':
          await db.studySessions.delete(record.recordId)
          break
        case 'userProfiles':
          await db.userProfiles.delete(record.recordId)
          break
        default:
          console.warn(`Table ${record.tableName} delete not implemented`)
      }
    } catch (error) {
      console.warn(`Failed to delete record ${record.recordId} from ${record.tableName}:`, error)
    }
  }

  private async handleServerConflict(
    clientRecord: SyncRecord,
    resolution: ConflictResolution
  ): Promise<void> {
    await syncQueue.updateRecordStatus(
      clientRecord.id,
      'conflict',
      undefined,
      resolution.resolvedData
    )
  }

  async resolveConflict(
    recordId: string,
    resolution: 'server-wins' | 'client-wins' | 'merge' | 'timestamp'
  ): Promise<void> {
    const conflictedRecords = await syncQueue.getConflictedRecords()
    const record = conflictedRecords.find(r => r.id === recordId)

    if (!record || !record.conflictData) {
      throw new Error('Record or conflict data not found')
    }

    const conflictResolution = this.conflictResolver.resolve(record, record.conflictData)
    conflictResolution.strategy = resolution
    conflictResolution.resolvedData = this.applyResolutionStrategy(
      record,
      record.conflictData,
      resolution
    )

    await this.applyResolvedConflict(record, conflictResolution)
    await syncQueue.removeRecord(recordId)

    const conflictedCount = await syncQueue.getConflictedCount()
    this.updateState({ conflictedCount })
  }

  private applyResolutionStrategy(
    clientRecord: SyncRecord,
    serverData: Record<string, unknown>,
    strategy: 'server-wins' | 'client-wins' | 'merge' | 'timestamp'
  ): Record<string, unknown> {
    switch (strategy) {
      case 'server-wins':
        return { ...serverData }
      case 'client-wins':
        return { ...(clientRecord.data || {}), ...serverData }
      case 'merge':
        return defaultConflictResolver.resolve(clientRecord, serverData).resolvedData
      case 'timestamp':
      default:
        return clientRecord.timestamp > (serverData._lastModified as number || 0)
          ? { ...(clientRecord.data || {}), ...serverData }
          : { ...serverData }
    }
  }

  private async applyResolvedConflict(
    record: SyncRecord,
    resolution: ConflictResolution
  ): Promise<void> {
    const resolvedData = {
      ...resolution.resolvedData,
      id: record.recordId,
      _lastModified: resolution.resolvedAt,
      _syncedFrom: 'server',
    }

    switch (record.tableName) {
      case 'questions':
        await db.questions.put(resolvedData as any)
        break
      case 'userAnswers':
        await db.userAnswers.put(resolvedData as any)
        break
      case 'wrongQuestions':
        await db.wrongQuestions.put(resolvedData as any)
        break
      case 'learningGoals':
        await db.learningGoals.put(resolvedData as any)
        break
      case 'flashCards':
        await db.flashCards.put(resolvedData as any)
        break
      case 'userFlashCardReviews':
        await db.userFlashCardReviews.put(resolvedData as any)
        break
      case 'dailyStats':
        await db.dailyStats.put(resolvedData as any)
        break
      case 'studySessions':
        await db.studySessions.put(resolvedData as any)
        break
      case 'userProfiles':
        await db.userProfiles.put(resolvedData as any)
        break
      default:
        throw new Error(`Table ${record.tableName} apply resolved conflict not implemented`)
    }
  }

  private async resolveAllConflicts(): Promise<void> {
    const conflictedRecords = await syncQueue.getConflictedRecords()

    for (const record of conflictedRecords) {
      if (record.conflictData) {
        const resolution = this.conflictResolver.resolve(record, record.conflictData)
        resolution.strategy = 'timestamp'

        await this.applyResolvedConflict(record, resolution)
        await syncQueue.removeRecord(record.id)
      }
    }

    const conflictedCount = await syncQueue.getConflictedCount()
    this.updateState({ conflictedCount })
  }

  async getStatus(): Promise<SyncStatusResponse> {
    const pendingCount = await syncQueue.getPendingCount()
    const conflictedCount = await syncQueue.getConflictedCount()
    const lastSync = await syncQueue.getLastSyncTimestamp()

    return {
      lastSyncTimestamp: lastSync,
      pendingCount,
      conflictedCount,
      isOnline: this.state.isOnline,
      deviceId: syncQueue.getDeviceId(),
    }
  }

  async trackLocalChange(
    operation: SyncRecord['operation'],
    tableName: string,
    recordId: string,
    data: Record<string, unknown> | null
  ): Promise<void> {
    const userStore = useUserStore.getState()
    if (!userStore.currentUser) return

    await syncQueue.addRecord(
      operation,
      tableName as any,
      recordId,
      data,
      userStore.currentUser.id
    )

    const pendingCount = await syncQueue.getPendingCount()
    this.updateState({ pendingCount })

    if (this.state.isOnline && !this.state.isSyncing) {
      this.syncNow()
    }
  }

  async clearAllData(): Promise<void> {
    await syncQueue.clearAll()
    this.updateState({
      pendingCount: 0,
      conflictedCount: 0,
      lastSyncTimestamp: null,
    })
  }

  getState(): SyncState {
    return { ...this.state }
  }
}

export const syncService = new SyncService()