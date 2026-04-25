export type SyncOperation = 'create' | 'update' | 'delete'

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict'

export type ConflictResolutionStrategy = 'timestamp' | 'server-wins' | 'client-wins' | 'merge'

export interface SyncRecord {
  id: string
  operation: SyncOperation
  tableName: string
  recordId: string
  data: Record<string, unknown> | null
  timestamp: number
  deviceId: string
  userId: string
  status: SyncStatus
  retryCount: number
  error?: string
  conflictData?: Record<string, unknown>
}

export interface SyncBatch {
  id: string
  records: SyncRecord[]
  createdAt: number
  status: 'pending' | 'uploading' | 'completed' | 'failed'
}

export interface SyncPullResponse {
  records: SyncRecord[]
  lastSyncTimestamp: number
  hasMore: boolean
}

export interface SyncPushResponse {
  success: boolean
  syncedCount: number
  failedRecords: Array<{ id: string; error: string }>
  conflicts: Array<{
    recordId: string
    serverData: Record<string, unknown>
    resolution: ConflictResolutionStrategy
  }>
}

export interface SyncStatusResponse {
  lastSyncTimestamp: number
  pendingCount: number
  conflictedCount: number
  isOnline: boolean
  deviceId: string
}

export interface ConflictResolution {
  recordId: string
  tableName: string
  strategy: ConflictResolutionStrategy
  resolvedData: Record<string, unknown>
  resolvedAt: number
}

export interface SyncState {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTimestamp: number | null
  pendingCount: number
  conflictedCount: number
  currentError: string | null
}

export const SYNC_TABLES = [
  'users',
  'userProfiles',
  'userSubjects',
  'subjects',
  'chapters',
  'knowledgePoints',
  'articles',
  'questions',
  'questionOptions',
  'userAnswers',
  'wrongQuestions',
  'testPapers',
  'testPaperQuestions',
  'knowledgeRelations',
  'userFiles',
  'fileFolders',
  'fileTags',
  'fileKnowledgeLinks',
  'reviewSchedules',
  'flashCards',
  'userFlashCardReviews',
  'learningGoals',
  'studySessions',
  'dailyStats',
  'userStreaks',
] as const

export type SyncTable = string

export const DEFAULT_SYNC_INTERVAL = 30000

export const MAX_BATCH_SIZE = 100

export const MAX_RETRY_COUNT = 3

export const CONFLICT_FIELDS: Record<string, Array<{ field: string; strategy: ConflictResolutionStrategy }>> = {
  userAnswers: [
    { field: 'isCorrect', strategy: 'server-wins' },
    { field: 'answeredAt', strategy: 'server-wins' },
  ],
  wrongQuestions: [
    { field: 'status', strategy: 'merge' },
    { field: 'masteredAt', strategy: 'merge' },
  ],
  learningGoals: [
    { field: 'currentValue', strategy: 'merge' },
    { field: 'status', strategy: 'timestamp' },
  ],
  dailyStats: [
    { field: 'totalQuestions', strategy: 'merge' },
    { field: 'correctCount', strategy: 'merge' },
  ],
} as const