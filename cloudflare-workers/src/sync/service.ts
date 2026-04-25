import type { SyncRecord } from '../types'
import type { Env } from '../types'

export interface SyncConflict {
  recordId: string
  localData: Record<string, unknown>
  serverData: Record<string, unknown>
  resolution: 'local' | 'server' | 'merge'
  resolvedData?: Record<string, unknown>
}

export function getSyncKey(userId: string, tableName: string): string {
  return `sync:${userId}:${tableName}`
}

export function getSyncRecordKey(userId: string, recordId: string): string {
  return `record:${userId}:${recordId}`
}

export function getLastSyncKey(userId: string, deviceId: string): string {
  return `lastSync:${userId}:${deviceId}`
}

export async function getPendingSyncRecords(
  env: Env,
  userId: string
): Promise<SyncRecord[]> {
  const pattern = `record:${userId}:*`
  const list = await env.SYNC_KV.list({ prefix: pattern })
  const records: SyncRecord[] = []

  for (const key of list.keys) {
    const data = await env.SYNC_KV.get(key.name)
    if (data) {
      records.push(JSON.parse(data) as SyncRecord)
    }
  }

  return records.filter(r => !r.synced)
}

export async function saveSyncRecord(
  env: Env,
  record: SyncRecord
): Promise<void> {
  const key = getSyncRecordKey(record.userId, record.id)
  await env.SYNC_KV.put(key, JSON.stringify(record))
}

export async function markRecordsSynced(
  env: Env,
  recordIds: string[],
  userId: string
): Promise<void> {
  for (const recordId of recordIds) {
    const key = getSyncRecordKey(userId, recordId)
    const data = await env.SYNC_KV.get(key)
    if (data) {
      const record = JSON.parse(data) as SyncRecord
      record.synced = true
      await env.SYNC_KV.put(key, JSON.stringify(record))
    }
  }
}

export async function getServerChanges(
  env: Env,
  userId: string,
  since: number
): Promise<SyncRecord[]> {
  const key = `changes:${userId}`
  const data = await env.SYNC_KV.get(key)
  if (!data) return []

  const changes: SyncRecord[] = JSON.parse(data)
  return changes.filter(c => c.timestamp > since)
}

export async function addServerChange(
  env: Env,
  record: SyncRecord
): Promise<void> {
  const key = `changes:${record.userId}`
  const data = await env.SYNC_KV.get(key)
  const changes: SyncRecord[] = data ? JSON.parse(data) : []
  changes.push(record)

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const filteredChanges = changes.filter(c => c.timestamp > oneWeekAgo)

  await env.SYNC_KV.put(key, JSON.stringify(filteredChanges))
}

export async function resolveConflict(
  localRecord: SyncRecord,
  serverRecord: SyncRecord,
  resolution: 'local' | 'server' | 'merge'
): Promise<Record<string, unknown>> {
  if (resolution === 'local') {
    return localRecord.data
  }

  if (resolution === 'server') {
    return serverRecord.data
  }

  const merged: Record<string, unknown> = { ...serverRecord.data }
  for (const [key, value] of Object.entries(localRecord.data)) {
    if (serverRecord.data[key] === undefined || localRecord.timestamp > serverRecord.timestamp) {
      merged[key] = value
    }
  }
  return merged
}

export function generateDeviceId(): string {
  return crypto.randomUUID()
}
