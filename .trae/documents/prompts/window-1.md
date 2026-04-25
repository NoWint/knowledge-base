# 6 对话并行执行 - 完整提示词

## 快速开始

复制下方对应的提示词，粘贴到 6 个独立的 Trae IDE 对话窗口中即可。

---

## 对话 1: 数据库类型 + 迁移工具

**提示词**:

```
请执行以下任务：

## 任务 A.1: 扩展数据库类型定义

修改文件: `src/types/database.ts`

在现有文件基础上，添加以下新类型和扩展现有接口：

### 1. 新增类型定义（在文件末尾添加）

```typescript
export type WrongReason = 'careless' | 'misunderstanding' | 'forgot' | null
export type GoalType = 'daily_questions' | 'weekly_streak' | 'mastery_level'
export type GoalStatus = 'active' | 'completed' | 'expired'
export type SessionType = 'practice' | 'review' | 'cards' | 'exam'

export interface ReviewSchedule {
  id: string
  userId: string
  questionId: string
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewDate: Date
  lastReviewDate: Date | null
}

export interface LearningGoal {
  id: string
  userId: string
  type: GoalType
  targetValue: number
  currentValue: number
  startDate: Date
  endDate: Date
  status: GoalStatus
}

export interface StudySession {
  id: string
  userId: string
  startTime: Date
  endTime: Date | null
  type: SessionType
  contentSummary: string
}

export interface FlashCard {
  id: string
  knowledgePointId: string
  front: string
  back: string
  createdAt: Date
  updatedAt: Date
}

export interface UserFlashCardReview {
  id: string
  userId: string
  flashCardId: string
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewDate: Date
  lastReviewDate: Date | null
}

export interface DailyStats {
  id: string
  userId: string
  date: string
  totalQuestions: number
  correctCount: number
  studyMinutes: number
  topicsCovered: string[]
}
```

### 2. 扩展 WrongQuestion 接口（找到现有接口添加新字段）

在 WrongQuestion 接口中添加：
```typescript
wrongReason: WrongReason
lastWrongReason: string
```

### 3. 扩展 Question 接口（找到现有接口添加新字段）

在 Question 接口中添加：
```typescript
tags: string[]
estimatedTime: number
fromAI: boolean
```

### 4. 扩展 KnowledgePoint 接口（找到现有接口添加新字段）

在 KnowledgePoint 接口中添加：
```typescript
masteryLevel: number
```

完成后，确保 TypeScript 编译无错误。
```

---

```
## 任务 A.2: 创建数据库迁移工具

新建文件: `src/lib/db/migrations.ts`

```typescript
import { db } from './database'

const CURRENT_VERSION = 2

export async function runMigrations() {
  const storedVersion = localStorage.getItem('db_version') || '1'

  if (parseInt(storedVersion) < 2) {
    await migrateToV2()
    localStorage.setItem('db_version', '2')
  }
}

async function migrateToV2() {
  await db.version(2).stores({
    users: 'id, name, createdAt',
    userProfiles: 'id, userId, currentGrade',
    userSubjects: 'id, userId, subjectId',
    subjects: 'id, name, gradeLevel, orderIndex',
    chapters: 'id, subjectId, parentId, orderIndex',
    knowledgePoints: 'id, chapterId, name, difficulty',
    articles: 'id, knowledgePointId, type, createdAt',
    questions: 'id, knowledgePointId, type, difficulty, *tags',
    questionOptions: 'id, questionId, label, isCorrect',
    userAnswers: 'id, userId, questionId, answeredAt, isCorrect',
    wrongQuestions: 'id, userId, questionId, status, lastWrongAt',
    testPapers: 'id, name, subjectId',
    testPaperQuestions: 'id, testPaperId, questionId, orderIndex',
    knowledgeRelations: 'id, sourceKpId, targetKpId, relationType',
    userFiles: 'id, userId, folderId, fileName, fileType, createdAt',
    fileFolders: 'id, userId, parentId, folderName',
    fileTags: 'id, userId, tagName',
    fileKnowledgeLinks: 'id, fileId, knowledgePointId',
    reviewSchedules: 'id, userId, questionId, nextReviewDate',
    learningGoals: 'id, userId, type, status',
    studySessions: 'id, userId, startTime',
    flashCards: 'id, knowledgePointId, createdAt',
    userFlashCardReviews: 'id, userId, flashCardId, nextReviewDate',
    dailyStats: 'id, userId, date',
  })
}
```

完成后，确保 TypeScript 编译无错误。
```

---

**状态更新**: 在 `expansion-plan.md` 中标记 Task A.1 和 A.2 为进行中，完成后标记为已完成。
