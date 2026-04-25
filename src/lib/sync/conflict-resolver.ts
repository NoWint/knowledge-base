import type {
  SyncRecord,
  ConflictResolution,
  ConflictResolutionStrategy,
} from './types'

interface ConflictFieldConfig {
  field: string
  strategy: ConflictResolutionStrategy
}

function deepMerge(
  clientData: Record<string, unknown>,
  serverData: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...serverData }

  for (const key in clientData) {
    if (key in serverData) {
      if (
        typeof clientData[key] === 'object' &&
        typeof serverData[key] === 'object' &&
        clientData[key] !== null &&
        serverData[key] !== null
      ) {
        result[key] = deepMerge(
          clientData[key] as Record<string, unknown>,
          serverData[key] as Record<string, unknown>
        )
      } else {
        const serverVal = serverData[key]
        const clientVal = clientData[key]
        if (serverVal !== undefined && clientVal !== undefined) {
          if (typeof serverVal === 'number' && typeof clientVal === 'number') {
            result[key] = Math.max(serverVal, clientVal)
          } else if (key.includes('Count') || key.includes('count')) {
            result[key] = (serverVal as number) + (clientVal as number)
          } else {
            result[key] = serverVal
          }
        } else {
          result[key] = serverVal ?? clientVal
        }
      }
    } else {
      result[key] = clientData[key]
    }
  }

  return result
}

export function resolveByTimestamp(
  clientRecord: SyncRecord,
  serverData: Record<string, unknown>
): Record<string, unknown> {
  if (clientRecord.timestamp > (serverData._lastModified as number || 0)) {
    return { ...serverData, ...clientRecord.data }
  }
  return serverData
}

export function resolveByServerWins(
  clientRecord: SyncRecord,
  serverData: Record<string, unknown>
): Record<string, unknown> {
  return { ...serverData }
}

export function resolveByClientWins(
  clientRecord: SyncRecord,
  serverData: Record<string, unknown>
): Record<string, unknown> {
  return { ...clientRecord.data }
}

export function resolveByMerge(
  clientRecord: SyncRecord,
  serverData: Record<string, unknown>
): Record<string, unknown> {
  return deepMerge(clientRecord.data || {}, serverData)
}

export function resolveConflict(
  clientRecord: SyncRecord,
  serverData: Record<string, unknown>,
  tableName: string
): ConflictResolution {
  const fieldConfigs: Record<string, ConflictFieldConfig[]> = {
    userAnswers: [
      { field: 'isCorrect', strategy: 'server-wins' },
      { field: 'answeredAt', strategy: 'server-wins' },
      { field: 'timeSpent', strategy: 'merge' },
    ],
    wrongQuestions: [
      { field: 'status', strategy: 'merge' },
      { field: 'masteredAt', strategy: 'merge' },
      { field: 'wrongCount', strategy: 'merge' },
    ],
    learningGoals: [
      { field: 'currentValue', strategy: 'merge' },
      { field: 'status', strategy: 'timestamp' },
      { field: 'targetValue', strategy: 'server-wins' },
    ],
    dailyStats: [
      { field: 'totalQuestions', strategy: 'merge' },
      { field: 'correctCount', strategy: 'merge' },
      { field: 'studyMinutes', strategy: 'merge' },
    ],
    userFlashCardReviews: [
      { field: 'easeFactor', strategy: 'timestamp' },
      { field: 'interval', strategy: 'timestamp' },
      { field: 'repetitions', strategy: 'timestamp' },
      { field: 'nextReviewDate', strategy: 'timestamp' },
    ],
  }

  const tableConfig = fieldConfigs[tableName]
  if (!tableConfig) {
    return {
      recordId: clientRecord.recordId,
      tableName,
      strategy: 'timestamp',
      resolvedData: resolveByTimestamp(clientRecord, serverData),
      resolvedAt: Date.now(),
    }
  }

  const result: Record<string, unknown> = { ...serverData }

  for (const config of tableConfig) {
    const clientValue = clientRecord.data?.[config.field]
    const serverValue = serverData[config.field]

    switch (config.strategy) {
      case 'server-wins':
        result[config.field] = serverValue
        break
      case 'client-wins':
        result[config.field] = clientValue
        break
      case 'timestamp':
        const clientTime = (clientRecord.data?.[`_${config.field}Modified`] as number) || 0
        const serverTime = (serverData[`_${config.field}Modified`] as number) || 0
        result[config.field] = clientTime > serverTime ? clientValue : serverValue
        break
      case 'merge':
        if (typeof clientValue === 'number' && typeof serverValue === 'number') {
          if (config.field.includes('Count')) {
            result[config.field] = serverValue + clientValue
          } else {
            result[config.field] = Math.max(serverValue, clientValue)
          }
        } else {
          result[config.field] = serverValue ?? clientValue
        }
        break
    }
  }

  for (const key in clientRecord.data || {}) {
    if (!(key in serverData) && !key.startsWith('_')) {
      result[key] = (clientRecord.data || {})[key]
    }
  }

  const usedStrategies = tableConfig.map(c => c.strategy)
  const primaryStrategy = usedStrategies.includes('merge') ? 'merge' :
    usedStrategies.includes('server-wins') ? 'server-wins' :
    usedStrategies.includes('client-wins') ? 'client-wins' : 'timestamp'

  return {
    recordId: clientRecord.recordId,
    tableName,
    strategy: primaryStrategy,
    resolvedData: result,
    resolvedAt: Date.now(),
  }
}

export class ConflictResolver {
  private defaultStrategy: ConflictResolutionStrategy

  constructor(defaultStrategy: ConflictResolutionStrategy = 'timestamp') {
    this.defaultStrategy = defaultStrategy
  }

  resolve(
    clientRecord: SyncRecord,
    serverData: Record<string, unknown>
  ): ConflictResolution {
    switch (this.defaultStrategy) {
      case 'server-wins':
        return {
          recordId: clientRecord.recordId,
          tableName: clientRecord.tableName,
          strategy: 'server-wins',
          resolvedData: resolveByServerWins(clientRecord, serverData),
          resolvedAt: Date.now(),
        }
      case 'client-wins':
        return {
          recordId: clientRecord.recordId,
          tableName: clientRecord.tableName,
          strategy: 'client-wins',
          resolvedData: resolveByClientWins(clientRecord, serverData),
          resolvedAt: Date.now(),
        }
      case 'merge':
        return {
          recordId: clientRecord.recordId,
          tableName: clientRecord.tableName,
          strategy: 'merge',
          resolvedData: resolveByMerge(clientRecord, serverData),
          resolvedAt: Date.now(),
        }
      case 'timestamp':
      default:
        return resolveConflict(clientRecord, serverData, clientRecord.tableName)
    }
  }

  resolveBatch(
    conflicts: Array<{ clientRecord: SyncRecord; serverData: Record<string, unknown> }>
  ): ConflictResolution[] {
    return conflicts.map(({ clientRecord, serverData }) =>
      this.resolve(clientRecord, serverData)
    )
  }

  setDefaultStrategy(strategy: ConflictResolutionStrategy): void {
    this.defaultStrategy = strategy
  }
}

export const defaultConflictResolver = new ConflictResolver()