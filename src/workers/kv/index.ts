import type { Env, User, Subscription, SyncRecord } from '../types'

export class UserKV {
  constructor(private kv: KVNamespace) {}

  async get(userId: string): Promise<User | null> {
    const data = await this.kv.get(`user:${userId}`)
    if (!data) return null
    return JSON.parse(data)
  }

  async put(user: User): Promise<void> {
    await this.kv.put(`user:${user.id}`, JSON.stringify(user))
    await this.kv.put(`user:email:${user.email}`, user.id)
  }

  async delete(userId: string): Promise<void> {
    const user = await this.get(userId)
    if (user) {
      await this.kv.delete(`user:email:${user.email}`)
    }
    await this.kv.delete(`user:${userId}`)
  }

  async getByEmail(email: string): Promise<User | null> {
    const userId = await this.kv.get(`user:email:${email}`)
    if (!userId) return null
    return this.get(userId)
  }

  async list(): Promise<User[]> {
    const list = await this.kv.list({ prefix: 'user:' })
    const users: User[] = []

    for (const key of list.keys) {
      if (!key.name.includes(':email:')) {
        const data = await this.kv.get(key.name)
        if (data) {
          users.push(JSON.parse(data))
        }
      }
    }

    return users
  }
}

export class SubscriptionKV {
  constructor(private kv: KVNamespace) {}

  async get(subscriptionId: string): Promise<Subscription | null> {
    const data = await this.kv.get(`subscription:${subscriptionId}`)
    if (!data) return null
    return JSON.parse(data)
  }

  async put(subscription: Subscription): Promise<void> {
    await this.kv.put(`subscription:${subscription.id}`, JSON.stringify(subscription))
    await this.kv.put(`subscription:user:${subscription.userId}`, subscription.id)
  }

  async getByUserId(userId: string): Promise<Subscription | null> {
    const subscriptionId = await this.kv.get(`subscription:user:${userId}`)
    if (!subscriptionId) return null
    return this.get(subscriptionId)
  }

  async delete(subscriptionId: string): Promise<void> {
    const subscription = await this.get(subscriptionId)
    if (subscription) {
      await this.kv.delete(`subscription:user:${subscription.userId}`)
    }
    await this.kv.delete(`subscription:${subscriptionId}`)
  }

  async deleteByUserId(userId: string): Promise<void> {
    const subscriptionId = await this.kv.get(`subscription:user:${userId}`)
    if (subscriptionId) {
      await this.delete(subscriptionId)
    }
  }
}

export interface ExtendedSyncRecord {
  id: string
  userId: string
  tableName: string
  operation: 'create' | 'update' | 'delete'
  recordId: string
  data: string
  timestamp: number
  deviceId: string
  synced: boolean
}

export class SyncKV {
  constructor(private kv: KVNamespace) {}

  async add(record: SyncRecord): Promise<void> {
    await this.kv.put(`sync:${record.id}`, JSON.stringify(record))
  }

  async get(recordId: string): Promise<SyncRecord | null> {
    const data = await this.kv.get(`sync:${recordId}`)
    if (!data) return null
    return JSON.parse(data)
  }

  async getFromKey(key: string): Promise<string | null> {
    return await this.kv.get(key)
  }

  async putToKey(key: string, value: string): Promise<void> {
    await this.kv.put(key, value)
  }

  async getUnsynced(userId: string, limit: number = 100): Promise<SyncRecord[]> {
    const list = await this.kv.list({ prefix: `sync:${userId}:` })
    const records: SyncRecord[] = []

    for (const key of list.keys) {
      if (records.length >= limit) break
      const data = await this.kv.get(key.name)
      if (data) {
        const record = JSON.parse(data) as SyncRecord
        if (!record.synced) {
          records.push(record)
        }
      }
    }

    return records
  }

  async getRecordsSince(userId: string, since: number, limit: number): Promise<ExtendedSyncRecord[]> {
    const list = await this.kv.list({ prefix: `sync:${userId}:` })
    const records: ExtendedSyncRecord[] = []

    for (const key of list.keys) {
      if (records.length >= limit) break
      const data = await this.kv.get(key.name)
      if (data) {
        const record = JSON.parse(data) as ExtendedSyncRecord
        if (record.timestamp > since) {
          records.push(record)
        }
      }
    }

    return records.sort((a, b) => a.timestamp - b.timestamp)
  }

  async markSynced(recordId: string): Promise<void> {
    const record = await this.get(recordId)
    if (record) {
      record.synced = true
      await this.kv.put(`sync:${recordId}`, JSON.stringify(record))
    }
  }

  async markSyncedByTableRecord(userId: string, tableName: string, recordId: string): Promise<void> {
    const latestKey = `sync:${userId}:${tableName}:${recordId}:latest`
    const data = await this.kv.get(latestKey)
    if (data) {
      const record = JSON.parse(data)
      record.synced = true
      await this.kv.put(latestKey, JSON.stringify(record))
    }
  }

  async delete(recordId: string): Promise<void> {
    await this.kv.delete(`sync:${recordId}`)
  }

  async deleteSyncedOlderThan(timestamp: number): Promise<number> {
    const list = await this.kv.list()
    let deleted = 0

    for (const key of list.keys) {
      if (!key.name.startsWith('sync:')) continue
      const data = await this.kv.get(key.name)
      if (data) {
        const record = JSON.parse(data) as SyncRecord
        if (record.synced && record.timestamp < timestamp) {
          await this.kv.delete(key.name)
          deleted++
        }
      }
    }

    return deleted
  }
}

export function createUserKV(env: Env): UserKV {
  return new UserKV(env.USERS_KV)
}

export function createSubscriptionKV(env: Env): SubscriptionKV {
  return new SubscriptionKV(env.SUBSCRIPTIONS_KV)
}

export function createSyncKV(env: Env): SyncKV {
  return new SyncKV(env.SYNC_KV)
}