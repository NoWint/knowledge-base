import { Hono } from 'hono'
import type { Context } from 'hono'
import type { Env, SyncRecord, JWTPayload } from '../types'
import { createSuccessResponse, createErrorResponse } from '../types'
import { authMiddleware } from '../middleware/auth'
import { AppError } from '../middleware/error-handler'
import { createSyncKV } from '../kv'

export const syncRouter = new Hono<{ Bindings: Env }>()

syncRouter.post('/push', authMiddleware, async (c: Context<{ Bindings: Env }>) => {
  try {
    const jwtPayload = c.get('jwtPayload') as JWTPayload
    const records = await c.req.json<SyncRecord[]>()

    if (!Array.isArray(records)) {
      throw new AppError('Records must be an array', 400)
    }

    const syncKV = createSyncKV(c.env)
    const now = Date.now()

    for (const record of records) {
      const syncRecord: SyncRecord = {
        id: `${jwtPayload.userId}:${now}:${crypto.randomUUID()}`,
        userId: jwtPayload.userId,
        tableName: record.tableName,
        operation: record.operation,
        recordId: record.recordId,
        data: JSON.stringify(record.data),
        timestamp: now,
        synced: false,
      }

      await syncKV.add(syncRecord)
    }

    return c.json(createSuccessResponse({ pushed: records.length }))
  } catch (err) {
    console.error('Sync push error:', err)
    const message = err instanceof Error ? err.message : 'Sync push failed'
    return c.json(createErrorResponse(message), 500)
  }
})

syncRouter.get('/pull', authMiddleware, async (c: Context<{ Bindings: Env }>) => {
  try {
    const jwtPayload = c.get('jwtPayload') as JWTPayload
    const limit = parseInt(c.req.query('limit') || '100')

    const syncKV = createSyncKV(c.env)
    const records = await syncKV.getUnsynced(jwtPayload.userId, limit)

    return c.json(createSuccessResponse({ records }))
  } catch (err) {
    console.error('Sync pull error:', err)
    const message = err instanceof Error ? err.message : 'Sync pull failed'
    return c.json(createErrorResponse(message), 500)
  }
})

syncRouter.post('/ack', authMiddleware, async (c: Context<{ Bindings: Env }>) => {
  try {
    const { recordIds } = await c.req.json<{ recordIds: string[] }>()

    if (!Array.isArray(recordIds)) {
      throw new AppError('recordIds must be an array', 400)
    }

    const syncKV = createSyncKV(c.env)

    for (const recordId of recordIds) {
      await syncKV.markSynced(recordId)
    }

    return c.json(createSuccessResponse({ acknowledged: recordIds.length }))
  } catch (err) {
    console.error('Sync ack error:', err)
    const message = err instanceof Error ? err.message : 'Sync ack failed'
    return c.json(createErrorResponse(message), 500)
  }
})

syncRouter.delete('/cleanup', authMiddleware, async (c: Context<{ Bindings: Env }>) => {
  try {
    const daysOld = parseInt(c.req.query('days') || '7')
    const timestamp = Date.now() - daysOld * 24 * 60 * 60 * 1000

    const syncKV = createSyncKV(c.env)
    const deleted = await syncKV.deleteSyncedOlderThan(timestamp)

    return c.json(createSuccessResponse({ deleted }))
  } catch (err) {
    console.error('Sync cleanup error:', err)
    const message = err instanceof Error ? err.message : 'Sync cleanup failed'
    return c.json(createErrorResponse(message), 500)
  }
})

syncRouter.get('/status', authMiddleware, async (c: Context<{ Bindings: Env }>) => {
  try {
    const jwtPayload = c.get('jwtPayload') as JWTPayload
    const syncKV = createSyncKV(c.env)

    const records = await syncKV.getUnsynced(jwtPayload.userId, 1000)

    return c.json(createSuccessResponse({
      pendingCount: records.length,
      lastSync: records.length > 0 ? Math.max(...records.map(r => r.timestamp)) : null,
    }))
  } catch (err) {
    console.error('Sync status error:', err)
    const message = err instanceof Error ? err.message : 'Failed to get sync status'
    return c.json(createErrorResponse(message), 500)
  }
})