import { Hono } from 'hono'
import type { Context } from 'hono'
import type { Env, APIResponse, SyncRecord } from '../types'
import { verifyToken } from '../auth/service'
import {
  getPendingSyncRecords,
  saveSyncRecord,
  markRecordsSynced,
  getServerChanges,
  addServerChange,
  getLastSyncKey,
  resolveConflict,
  generateDeviceId,
} from './service'

export const syncRouter = new Hono<{ Bindings: Env }>()

function getAuthUser(c: Context<{ Bindings: Env }>) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token, c.env.JWT_SECRET)
}

syncRouter.post('/push', async (c) => {
  try {
    const user = getAuthUser(c)
    if (!user) {
      const response: APIResponse = { success: false, error: 'Unauthorized', timestamp: Date.now() }
      return c.json(response, 401)
    }

    const body = await c.req.json()
    const { records, deviceId } = body as { records: SyncRecord[]; deviceId: string }

    if (!records || !Array.isArray(records)) {
      const response: APIResponse = {
        success: false,
        error: 'Validation Error',
        message: 'Records array is required',
        timestamp: Date.now(),
      }
      return c.json(response, 400)
    }

    const conflicts: SyncRecord[] = []
    const accepted: string[] = []

    for (const record of records) {
      record.userId = user.userId
      record.synced = false

      const existingKey = `changes:${user.userId}`
      const existingData = await c.env.SYNC_KV.get(existingKey)
      let existingRecords: SyncRecord[] = existingData ? JSON.parse(existingData) : []

      const serverRecord = existingRecords.find(
        r => r.recordId === record.recordId && r.tableName === record.tableName
      )

      if (serverRecord && serverRecord.timestamp > record.timestamp) {
        conflicts.push(serverRecord)
      } else {
        await saveSyncRecord(c.env, record)
        await addServerChange(c.env, record)
        accepted.push(record.id)
      }
    }

    const lastSyncKey = getLastSyncKey(user.userId, deviceId)
    await c.env.SYNC_KV.put(lastSyncKey, String(Date.now()))

    const response: APIResponse<{
      accepted: string[]
      conflicts: SyncRecord[]
      syncedCount: number
    }> = {
      success: true,
      data: {
        accepted,
        conflicts,
        syncedCount: accepted.length,
      },
      timestamp: Date.now(),
    }
    return c.json(response)
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: 'Sync Error',
      message: error instanceof Error ? error.message : 'Sync failed',
      timestamp: Date.now(),
    }
    return c.json(response, 500)
  }
})

syncRouter.get('/pull', async (c) => {
  try {
    const user = getAuthUser(c)
    if (!user) {
      const response: APIResponse = { success: false, error: 'Unauthorized', timestamp: Date.now() }
      return c.json(response, 401)
    }

    const deviceId = c.req.header('X-Device-Id')
    const sinceParam = c.req.query('since')
    const since = sinceParam ? parseInt(sinceParam) : 0

    const lastSyncKey = getLastSyncKey(user.userId, deviceId || 'unknown')
    const lastSyncTime = await c.env.SYNC_KV.get(lastSyncKey)
    const syncSince = lastSyncTime ? parseInt(lastSyncTime) : since

    const changes = await getServerChanges(c.env, user.userId, syncSince)

    const response: APIResponse<{
      records: SyncRecord[]
      syncedAt: number
      hasMore: boolean
    }> = {
      success: true,
      data: {
        records: changes,
        syncedAt: Date.now(),
        hasMore: false,
      },
      timestamp: Date.now(),
    }
    return c.json(response)
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: 'Sync Error',
      message: error instanceof Error ? error.message : 'Pull failed',
      timestamp: Date.now(),
    }
    return c.json(response, 500)
  }
})

syncRouter.get('/status', async (c) => {
  try {
    const user = getAuthUser(c)
    if (!user) {
      const response: APIResponse = { success: false, error: 'Unauthorized', timestamp: Date.now() }
      return c.json(response, 401)
    }

    const deviceId = c.req.header('X-Device-Id')
    const lastSyncKey = getLastSyncKey(user.userId, deviceId || 'unknown')
    const lastSyncTime = await c.env.SYNC_KV.get(lastSyncKey)

    const pending = await getPendingSyncRecords(c.env, user.userId)

    const response: APIResponse<{
      lastSyncedAt: number | null
      pendingCount: number
      deviceId: string
    }> = {
      success: true,
      data: {
        lastSyncedAt: lastSyncTime ? parseInt(lastSyncTime) : null,
        pendingCount: pending.length,
        deviceId: deviceId || generateDeviceId(),
      },
      timestamp: Date.now(),
    }
    return c.json(response)
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: 'Sync Error',
      message: error instanceof Error ? error.message : 'Status check failed',
      timestamp: Date.now(),
    }
    return c.json(response, 500)
  }
})

syncRouter.post('/resolve-conflict', async (c) => {
  try {
    const user = getAuthUser(c)
    if (!user) {
      const response: APIResponse = { success: false, error: 'Unauthorized', timestamp: Date.now() }
      return c.json(response, 401)
    }

    const body = await c.req.json()
    const { recordId, resolution, mergedData } = body as {
      recordId: string
      resolution: 'local' | 'server' | 'merge'
      mergedData?: Record<string, unknown>
    }

    const changesKey = `changes:${user.userId}`
    const changesData = await c.env.SYNC_KV.get(changesKey)
    const changes: SyncRecord[] = changesData ? JSON.parse(changesData) : []

    const recordIndex = changes.findIndex(r => r.recordId === recordId)
    if (recordIndex === -1) {
      const response: APIResponse = {
        success: false,
        error: 'Not Found',
        message: 'Record not found',
        timestamp: Date.now(),
      }
      return c.json(response, 404)
    }

    if (resolution === 'merge' && mergedData) {
      changes[recordIndex].data = mergedData
      changes[recordIndex].timestamp = Date.now()
      await c.env.SYNC_KV.put(changesKey, JSON.stringify(changes))
    }

    const response: APIResponse<{ resolved: boolean }> = {
      success: true,
      data: { resolved: true },
      timestamp: Date.now(),
    }
    return c.json(response)
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: 'Sync Error',
      message: error instanceof Error ? error.message : 'Conflict resolution failed',
      timestamp: Date.now(),
    }
    return c.json(response, 500)
  }
})
