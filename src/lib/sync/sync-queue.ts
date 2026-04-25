import type { SyncRecord, SyncBatch, SyncTable } from './types'

const DB_NAME = 'knowledge_sync_db'
const DB_VERSION = 1
const SYNC_RECORDS_STORE = 'sync_records'
const SYNC_BATCHES_STORE = 'sync_batches'
const SYNC_META_STORE = 'sync_meta'

interface SyncMeta {
  key: string
  value: string | number
}

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server'

  let deviceId = localStorage.getItem('sync_device_id')
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem('sync_device_id', deviceId)
  }
  return deviceId
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(SYNC_RECORDS_STORE)) {
        const recordStore = db.createObjectStore(SYNC_RECORDS_STORE, { keyPath: 'id' })
        recordStore.createIndex('tableName', 'tableName', { unique: false })
        recordStore.createIndex('status', 'status', { unique: false })
        recordStore.createIndex('timestamp', 'timestamp', { unique: false })
        recordStore.createIndex('userId', 'userId', { unique: false })
      }

      if (!db.objectStoreNames.contains(SYNC_BATCHES_STORE)) {
        const batchStore = db.createObjectStore(SYNC_BATCHES_STORE, { keyPath: 'id' })
        batchStore.createIndex('status', 'status', { unique: false })
        batchStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      if (!db.objectStoreNames.contains(SYNC_META_STORE)) {
        db.createObjectStore(SYNC_META_STORE, { keyPath: 'key' })
      }
    }
  })
}

export class SyncQueue {
  private db: IDBDatabase | null = null
  private deviceId: string

  constructor() {
    this.deviceId = getDeviceId()
    this.init()
  }

  private async init(): Promise<void> {
    try {
      this.db = await openDatabase()
    } catch (error) {
      console.error('Failed to initialize sync queue database:', error)
    }
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      this.db = await openDatabase()
    }
    return this.db
  }

  async addRecord(
    operation: SyncRecord['operation'],
    tableName: SyncTable,
    recordId: string,
    data: Record<string, unknown> | null,
    userId: string
  ): Promise<SyncRecord> {
    const db = await this.ensureDb()

    const record: SyncRecord = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      operation,
      tableName,
      recordId,
      data,
      timestamp: Date.now(),
      deviceId: this.deviceId,
      userId,
      status: 'pending',
      retryCount: 0,
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_RECORDS_STORE], 'readwrite')
      const store = transaction.objectStore(SYNC_RECORDS_STORE)
      const request = store.add(record)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(record)
    })
  }

  async getPendingRecords(limit: number = 100): Promise<SyncRecord[]> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_RECORDS_STORE], 'readonly')
      const store = transaction.objectStore(SYNC_RECORDS_STORE)
      const index = store.index('status')
      const request = index.getAll(IDBKeyRange.only('pending'))

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const records = request.result
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, limit)
        resolve(records)
      }
    })
  }

  async getConflictedRecords(): Promise<SyncRecord[]> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_RECORDS_STORE], 'readonly')
      const store = transaction.objectStore(SYNC_RECORDS_STORE)
      const index = store.index('status')
      const request = index.getAll(IDBKeyRange.only('conflict'))

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async updateRecordStatus(
    id: string,
    status: SyncRecord['status'],
    error?: string,
    conflictData?: Record<string, unknown>
  ): Promise<void> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_RECORDS_STORE], 'readwrite')
      const store = transaction.objectStore(SYNC_RECORDS_STORE)
      const getRequest = store.get(id)

      getRequest.onerror = () => reject(getRequest.error)
      getRequest.onsuccess = () => {
        const record = getRequest.result
        if (!record) {
          resolve()
          return
        }

        record.status = status
        if (error) {
          record.error = error
          record.retryCount += 1
        }
        if (conflictData) {
          record.conflictData = conflictData
        }

        const putRequest = store.put(record)
        putRequest.onerror = () => reject(putRequest.error)
        putRequest.onsuccess = () => resolve()
      }
    })
  }

  async removeRecord(id: string): Promise<void> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_RECORDS_STORE], 'readwrite')
      const store = transaction.objectStore(SYNC_RECORDS_STORE)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async removeSyncedRecords(ids: string[]): Promise<void> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_RECORDS_STORE], 'readwrite')
      const store = transaction.objectStore(SYNC_RECORDS_STORE)

      let completed = 0
      for (const id of ids) {
        const request = store.delete(id)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          completed++
          if (completed === ids.length) {
            resolve()
          }
        }
      }

      if (ids.length === 0) {
        resolve()
      }
    })
  }

  async createBatch(records: SyncRecord[]): Promise<SyncBatch> {
    const db = await this.ensureDb()

    const batch: SyncBatch = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      records,
      createdAt: Date.now(),
      status: 'pending',
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_BATCHES_STORE], 'readwrite')
      const store = transaction.objectStore(SYNC_BATCHES_STORE)
      const request = store.add(batch)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(batch)
    })
  }

  async updateBatchStatus(id: string, status: SyncBatch['status']): Promise<void> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_BATCHES_STORE], 'readwrite')
      const store = transaction.objectStore(SYNC_BATCHES_STORE)
      const getRequest = store.get(id)

      getRequest.onerror = () => reject(getRequest.error)
      getRequest.onsuccess = () => {
        const batch = getRequest.result
        if (batch) {
          batch.status = status
          const putRequest = store.put(batch)
          putRequest.onerror = () => reject(putRequest.error)
          putRequest.onsuccess = () => resolve()
        } else {
          resolve()
        }
      }
    })
  }

  async getPendingCount(): Promise<number> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_RECORDS_STORE], 'readonly')
      const store = transaction.objectStore(SYNC_RECORDS_STORE)
      const index = store.index('status')
      const request = index.count(IDBKeyRange.only('pending'))

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getConflictedCount(): Promise<number> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_RECORDS_STORE], 'readonly')
      const store = transaction.objectStore(SYNC_RECORDS_STORE)
      const index = store.index('status')
      const request = index.count(IDBKeyRange.only('conflict'))

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getMeta(key: string): Promise<string | number | null> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_META_STORE], 'readonly')
      const store = transaction.objectStore(SYNC_META_STORE)
      const request = store.get(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        resolve(request.result?.value ?? null)
      }
    })
  }

  async setMeta(key: string, value: string | number): Promise<void> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_META_STORE], 'readwrite')
      const store = transaction.objectStore(SYNC_META_STORE)
      const request = store.put({ key, value })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getLastSyncTimestamp(): Promise<number> {
    const timestamp = await this.getMeta('last_sync_timestamp')
    return typeof timestamp === 'number' ? timestamp : 0
  }

  async setLastSyncTimestamp(timestamp: number): Promise<void> {
    await this.setMeta('last_sync_timestamp', timestamp)
  }

  async getRecordsForTable(tableName: string, since: number): Promise<SyncRecord[]> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_RECORDS_STORE], 'readonly')
      const store = transaction.objectStore(SYNC_RECORDS_STORE)
      const index = store.index('tableName')
      const range = IDBKeyRange.only(tableName)
      const request = index.getAll(range)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const records = request.result.filter(
          (r: SyncRecord) => r.timestamp > since && r.status === 'pending'
        )
        resolve(records)
      }
    })
  }

  getDeviceId(): string {
    return this.deviceId
  }

  async clearAll(): Promise<void> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [SYNC_RECORDS_STORE, SYNC_BATCHES_STORE, SYNC_META_STORE],
        'readwrite'
      )

      let completed = 0
      const total = 3

      const clearStore = (storeName: string) => {
        const store = transaction.objectStore(storeName)
        const request = store.clear()
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          completed++
          if (completed === total) resolve()
        }
      }

      clearStore(SYNC_RECORDS_STORE)
      clearStore(SYNC_BATCHES_STORE)
      clearStore(SYNC_META_STORE)
    })
  }
}

export const syncQueue = new SyncQueue()