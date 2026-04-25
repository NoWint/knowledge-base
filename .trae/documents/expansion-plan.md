# 知识库学习系统 - 扩展实施计划

> **制定日期**: 2026-04-24
> **状态**: ✅ 全部完成（2026-04-24）
> **基于**: 三个核心价值方向 + 现有 MVP 基础

---

## ✅ 任务完成情况

| Task | 内容 | 状态 | 文件 |
|-----|------|------|------|
| **A.1** | 扩展数据库类型定义 | ✅ 完成 | `src/types/database.ts` |
| **A.2** | 创建数据库迁移工具 | ✅ 完成 | `src/lib/db/migrations.ts` |
| **A.3** | 创建 SM-2 算法实现 | ✅ 完成 | `src/lib/algorithms/sm2.ts` |
| **A.4** | 创建薄弱点检测算法 | ✅ 完成 | `src/lib/algorithms/weakness-detector.ts` |
| **B.1** | 创建复习提醒工具 | ✅ 完成 | `src/lib/notifications/review-notification.ts` |
| **B.2** | 创建复习计划页面 | ✅ 完成 | `src/app/review/page.tsx` |
| **B.3** | 重写错题本 2.0 | ✅ 完成 | `src/app/wrong/page.tsx` |
| **C.1** | 创建闪卡列表页面 | ✅ 完成 | `src/app/cards/page.tsx` |
| **C.2** | 创建翻转闪卡组件 | ✅ 完成 | `src/components/cards/flash-card.tsx` |
| **C.3** | 创建闪卡复习页面 | ✅ 完成 | `src/app/cards/review/page.tsx` |
| **D.1** | 创建每日统计逻辑 | ✅ 完成 | `src/lib/analytics/daily-stats.ts` |
| **D.2** | 创建学习热力图组件 | ✅ 完成 | `src/components/charts/heatmap.tsx` |
| **D.3** | 创建能力雷达图组件 | ✅ 完成 | `src/components/charts/radar-chart.tsx` |
| **-** | 创建 Progress 组件 | ✅ 完成 | `src/components/ui/progress.tsx` |

---

## 一、背景与目标

### 1.1 现有基础

项目已完成 Phase 1-4 的 MVP 开发：
- ✅ 用户系统（多用户切换）
- ✅ 学科内容系统（目录/知识点/文章）
- ✅ 题库系统（练习/答题/错题本）
- ✅ 数据分析（统计面板）
- ✅ 文件管理、导入导出
- ✅ 知识图谱可视化

### 1.2 三个核心价值方向

| 价值 | 核心优势 | 实施重点 |
|-----|---------|---------|
| **图谱 + 闭环** | 知识可视化 + 主动练习 + 掌握度追踪 | SM-2 算法、薄弱点检测、复习计划 |
| **本地优先** | 隐私、离线、可移植、无锁定 | 数据导出/导入、跨格式兼容 |
| **中考垂直** | 学科大纲到模拟考试全链路 | 知识点掌握度、备考冲刺视图 |

### 1.3 扩展目标

在不引入后端的前提下，通过扩展数据模型和算法能力，实现：
1. 科学复习机制（SM-2 间隔重复）
2. 智能错题本（状态追踪、原因分类）
3. 闪卡学习系统（翻转卡片、主动回忆）
4. 增强数据分析（热力图、雷达图、能力追踪）

---

## 二、数据模型扩展

### 2.1 新增 Stores

```typescript
// 复习计划 - SM-2 算法用
reviewSchedules: 'id, userId, questionId, easeFactor, interval, repetitions, nextReviewDate, lastReviewDate'

// 学习目标
learningGoals: 'id, userId, type, targetValue, currentValue, startDate, endDate, status'

// 学习会话
studySessions: 'id, userId, startTime, endTime, type, contentSummary'

// 闪卡
flashCards: 'id, knowledgePointId, front, back, createdAt, updatedAt'
userFlashCardReviews: 'id, userId, flashCardId, easeFactor, interval, repetitions, nextReviewDate'

// 每日统计聚合
dailyStats: 'id, userId, date, totalQuestions, correctCount, studyMinutes, topicsCovered'
```

### 2.2 扩展现有 Stores

```typescript
// WrongQuestion 扩展
WrongQuestion {
  // 现有字段...
  wrongReason: 'careless' | 'misunderstanding' | 'forgot' | null  // 错误原因
  lastWrongReason: string  // 上次错误原因记录
}

// Question 扩展
Question {
  // 现有字段...
  tags: string[]           // 题目标签
  estimatedTime: number    // 预估答题时间（秒）
  fromAI: boolean          // 是否 AI 生成
}

// KnowledgePoint 扩展
KnowledgePoint {
  // 现有字段...
  masteryLevel: number     // 0-100 掌握度（计算得出）
  relatedFlashCards: string[]  // 关联闪卡 ID
}
```

---

## 三、实施阶段

### Phase A: 数据基础设施（1-2周）

**目标**: 扩展 Dexie 数据库，支持后续功能

| Task | 内容 | 文件变更 |
|-----|------|---------|
| A.1 | 扩展数据库类型定义 | `src/types/database.ts` |
| A.2 | 创建数据库迁移工具 | `src/lib/db/migrations.ts` |
| A.3 | 创建 SM-2 算法实现 | `src/lib/algorithms/sm2.ts` |
| A.4 | 创建薄弱点检测算法 | `src/lib/algorithms/weakness-detector.ts` |

### Phase B: 复习系统核心（2-3周）

**目标**: 实现 SM-2 间隔重复 + 智能错题本

| Task | 内容 | 文件变更 |
|-----|------|---------|
| B.1 | 复习提醒 Service Worker | `src/lib/notifications/review-notification.ts` |
| B.2 | 复习计划页面 | `src/app/review/page.tsx` |
| B.3 | 错题本 2.0 页面 | 重写 `src/app/wrong/page.tsx` |
| B.4 | 错题原因标注功能 | 答题流程中嵌入 |

### Phase C: 闪卡系统（2-3周）

**目标**: 实现翻转闪卡 + 主动回忆

| Task | 内容 | 文件变更 |
|-----|------|---------|
| C.1 | 闪卡数据模型 + CRUD | `src/app/cards/page.tsx` |
| C.2 | 闪卡组件（翻转动画） | `src/components/cards/flash-card.tsx` |
| C.3 | 闪卡复习流程 | `src/app/cards/review/page.tsx` |
| C.4 | 知识点详情页嵌入闪卡入口 | `src/app/knowledge/resources/page.tsx` |

### Phase D: 增强数据分析（2-3周）

**目标**: 热力图、雷达图、能力追踪

| Task | 内容 | 文件变更 |
|-----|------|---------|
| D.1 | 每日统计聚合逻辑 | `src/lib/analytics/daily-stats.ts` |
| D.2 | 学习热力图组件 | `src/components/charts/heatmap.tsx` |
| D.3 | 能力雷达图组件 | `src/components/charts/radar-chart.tsx` |
| D.4 | 统计页面增强 | 重写 `src/app/stats/page.tsx` |
| D.5 | 学习目标页面 | `src/app/goals/page.tsx` |

---

## 四、详细 Task 分解

### Task A.1: 扩展数据库类型定义

**文件**: `src/types/database.ts`

- [ ] **Step 1: 添加新类型定义**

```typescript
// 新增类型
export type WrongReason = 'careless' | 'misunderstanding' | 'forgot' | null
export type GoalType = 'daily_questions' | 'weekly_streak' | 'mastery_level'
export type GoalStatus = 'active' | 'completed' | 'expired'
export type SessionType = 'practice' | 'review' | 'cards' | 'exam'

export interface ReviewSchedule {
  id: string
  userId: string
  questionId: string
  easeFactor: number      // 初始 2.5
  interval: number        // 间隔天数
  repetitions: number     // 连续正确次数
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
  date: string  // YYYY-MM-DD 格式
  totalQuestions: number
  correctCount: number
  studyMinutes: number
  topicsCovered: string[]
}
```

- [ ] **Step 2: 更新 WrongQuestion 接口**

```typescript
export interface WrongQuestion {
  id: string
  userId: string
  questionId: string
  wrongCount: number
  lastWrongAt: Date
  masteredAt: Date | null
  status: WrongQuestionStatus
  createdAt: Date
  wrongReason: WrongReason  // 新增
  lastWrongReason: string  // 新增
}
```

- [ ] **Step 3: 更新 Question 接口**

```typescript
export interface Question {
  id: string
  knowledgePointId: string
  type: QuestionType
  difficulty: number
  content: string
  answer: string
  explanation: string
  source: string
  tags: string[]          // 新增
  estimatedTime: number   // 新增
  fromAI: boolean         // 新增
}
```

- [ ] **Step 4: 更新 KnowledgePoint 接口**

```typescript
export interface KnowledgePoint {
  id: string
  chapterId: string
  name: string
  description: string
  difficulty: number
  content: string
  masteryLevel: number    // 新增 0-100
}
```

---

### Task A.2: 创建数据库迁移工具

**文件**: `src/lib/db/migrations.ts`

- [ ] **Step 1: 创建迁移管理器**

```typescript
import { db } from './database'

const CURRENT_VERSION = 2

export async function runMigrations() {
  const storedVersion = localStorage.getItem('db_version') || 1
  
  if (storedVersion < 2) {
    await migrateToV2()
    localStorage.setItem('db_version', '2')
  }
}

async function migrateToV2() {
  await db.version(2).stores({
    // 在现有 stores 基础上新增
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
    // 新增 stores
    reviewSchedules: 'id, userId, questionId, nextReviewDate',
    learningGoals: 'id, userId, type, status',
    studySessions: 'id, userId, startTime',
    flashCards: 'id, knowledgePointId, createdAt',
    userFlashCardReviews: 'id, userId, flashCardId, nextReviewDate',
    dailyStats: 'id, userId, date',
  })
}
```

---

### Task A.3: 创建 SM-2 算法实现

**文件**: `src/lib/algorithms/sm2.ts`

- [ ] **Step 1: 定义 SM-2 接口和常量**

```typescript
export interface SM2Input {
  quality: number  // 0-5, 0=完全忘记, 5=完美记住
  easeFactor: number
  interval: number
  repetitions: number
}

export interface SM2Output {
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewDate: Date
}

export const QUALITY_LABELS = {
  0: '完全遗忘',
  1: '错误，想起很久',
  2: '错误，想起快',
  3: '正确，困难',
  4: '正确，稍难',
  5: '正确，简单',
} as const
```

- [ ] **Step 2: 实现核心 SM-2 函数**

```typescript
export function calculateSM2(input: SM2Input): SM2Output {
  let { quality, easeFactor, interval, repetitions } = input
  
  if (quality >= 3) {
    // 答对了
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
  } else {
    // 答错了
    repetitions = 0
    interval = 1
  }
  
  // 更新 easeFactor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  
  // 最小 easeFactor 为 1.3
  if (easeFactor < 1.3) easeFactor = 1.3
  
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + interval)
  
  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
  }
}

// 将用户答题质量映射到 SM2 质量
export function mapAnswerToQuality(isCorrect: boolean, timeSpent: number, estimatedTime: number): number {
  if (!isCorrect) {
    return timeSpent < estimatedTime ? 1 : 0  // 答错但想得快 vs 想得慢
  }
  // 答对了
  const ratio = timeSpent / estimatedTime
  if (ratio > 2) return 3  // 很久才想起来
  if (ratio > 1) return 4  // 稍难
  return 5  // 简单
}
```

---

### Task A.4: 创建薄弱点检测算法

**文件**: `src/lib/algorithms/weakness-detector.ts`

- [ ] **Step 1: 定义薄弱点检测接口**

```typescript
export interface WeakPoint {
  knowledgePointId: string
  wrongRate: number        // 错误率
  totalAttempts: number    // 总尝试次数
  consecutiveWrong: number // 连续错误次数
  lastWrongAt: Date
  severity: 'high' | 'medium' | 'low'
}

export interface MasteryLevel {
  knowledgePointId: string
  mastery: number  // 0-100
  totalQuestions: number
  correctRate: number
  lastStudiedAt: Date | null
}
```

- [ ] **Step 2: 实现薄弱点检测函数**

```typescript
import { db } from '@/lib/db/database'

export async function detectWeakPoints(userId: string, minAttempts = 3): Promise<WeakPoint[]> {
  const answers = await db.userAnswers.where('userId').equals(userId).toArray()
  const questions = await db.questions.toArray()
  const questionMap = new Map(questions.map(q => [q.id, q]))
  
  // 按知识点分组
  const kpStats = new Map<string, { total: number; wrong: number; lastWrong: Date | null }>()
  
  for (const answer of answers) {
    const question = questionMap.get(answer.questionId)
    if (!question) continue
    
    const kpId = question.knowledgePointId
    const stats = kpStats.get(kpId) || { total: 0, wrong: 0, lastWrong: null }
    stats.total += 1
    if (!answer.isCorrect) stats.wrong += 1
    if (!answer.isCorrect && (!stats.lastWrong || answer.answeredAt > stats.lastWrong)) {
      stats.lastWrong = answer.answeredAt
    }
    kpStats.set(kpId, stats)
  }
  
  const weakPoints: WeakPoint[] = []
  
  for (const [kpId, stats] of kpStats) {
    if (stats.total < minAttempts) continue
    
    const wrongRate = stats.wrong / stats.total
    
    if (wrongRate > 0.4) {
      weakPoints.push({
        knowledgePointId: kpId,
        wrongRate,
        totalAttempts: stats.total,
        consecutiveWrong: 0, // 需要额外追踪
        lastWrongAt: stats.lastWrong || new Date(),
        severity: wrongRate > 0.7 ? 'high' : wrongRate > 0.5 ? 'medium' : 'low',
      })
    }
  }
  
  return weakPoints.sort((a, b) => b.wrongRate - a.wrongRate)
}

export async function calculateMasteryLevel(userId: string, knowledgePointId: string): Promise<MasteryLevel> {
  const questions = await db.questions.where('knowledgePointId').equals(knowledgePointId).toArray()
  const questionIds = questions.map(q => q.id)
  
  const answers = await db.userAnswers
    .where('userId').equals(userId)
    .filter(a => questionIds.includes(a.questionId))
    .toArray()
  
  if (answers.length === 0) {
    return {
      knowledgePointId,
      mastery: 0,
      totalQuestions: questions.length,
      correctRate: 0,
      lastStudiedAt: null,
    }
  }
  
  const correct = answers.filter(a => a.isCorrect).length
  const correctRate = correct / answers.length
  
  // 掌握度计算：考虑正确率和答题稳定性
  const mastery = Math.round(correctRate * 100)
  
  const lastStudied = answers.reduce((latest, a) => 
    a.answeredAt > latest ? a.answeredAt : latest, answers[0].answeredAt)
  
  return {
    knowledgePointId,
    mastery,
    totalQuestions: questions.length,
    correctRate,
    lastStudiedAt: lastStudied,
  }
}
```

---

## 五、技术架构

### 5.1 目录结构扩展

```
src/
├── app/
│   ├── review/              # 🆕 复习计划页
│   │   └── page.tsx
│   ├── cards/               # 🆕 闪卡系统
│   │   ├── page.tsx         # 闪卡列表
│   │   ├── create/page.tsx  # 创建闪卡
│   │   └── review/page.tsx  # 闪卡复习
│   ├── goals/               # 🆕 学习目标
│   │   └── page.tsx
│   └── wrong/               # 重写
│       └── page.tsx
├── components/
│   ├── cards/               # 🆕 闪卡组件
│   │   └── flash-card.tsx
│   ├── charts/              # 🆕 图表组件
│   │   ├── heatmap.tsx
│   │   ├── radar-chart.tsx
│   │   └── streak-calendar.tsx
│   └── review/              # 🆕 复习组件
│       └── review-item.tsx
├── lib/
│   ├── algorithms/          # 🆕 算法
│   │   ├── sm2.ts
│   │   └── weakness-detector.ts
│   ├── notifications/       # 🆕 提醒
│   │   └── review-notification.ts
│   ├── analytics/           # 🆕 分析
│   │   └── daily-stats.ts
│   └── db/
│       ├── database.ts       # 扩展
│       └── migrations.ts     # 🆕
└── types/
    └── database.ts          # 扩展
```

### 5.2 状态管理扩展

```typescript
// src/store/learning-store.ts (新增)
interface LearningState {
  todayStats: {
    questionsAnswered: number
    correctCount: number
    studyMinutes: number
  }
  weakPoints: WeakPoint[]
  currentGoal: LearningGoal | null
  
  fetchTodayStats: () => Promise<void>
  fetchWeakPoints: () => Promise<void>
  setGoal: (goal: LearningGoal) => Promise<void>
}
```

---

## 六、验收标准

### Phase A 验收
- [ ] 数据库类型定义完整编译通过
- [ ] 迁移工具可处理空数据库和已有数据库
- [ ] SM-2 算法单元测试通过
- [ ] 薄弱点检测返回正确排序

### Phase B 验收
- [ ] 复习页面显示今日待复习题目
- [ ] 错题可标注原因
- [ ] 错题状态正确流转 (wrong → correcting → mastered)
- [ ] Service Worker 推送提醒（可选，需 HTTPS）

### Phase C 验收
- [ ] 闪卡可创建/编辑/删除
- [ ] 翻转动画流畅
- [ ] 闪卡复习使用 SM-2 算法
- [ ] 知识点详情页显示关联闪卡

### Phase D 验收
- [ ] 学习热力图显示过去 30 天
- [ ] 能力雷达图显示各学科分布
- [ ] 统计页面包含新增图表
- [ ] 目标页面可创建/追踪目标

---

## 七、风险与备选

### 7.1 IndexedDB 存储限制
- **风险**: 单用户数据量超过浏览器限制（50-100MB）
- **应对**: 实现大文件压缩、清理旧数据、导出备份

### 7.2 SM-2 参数调优
- **风险**: 默认参数不适合所有用户
- **应对**: 提供参数调整 UI，记录用户反馈

### 7.3 闪卡内容生产
- **风险**: 用户需要手动创建大量闪卡
- **应对**: 支持 AI 生成（可选、外部 API），或批量导入

---

## 八、依赖关系

```
Task A.1 ──→ A.2 ──→ A.3 ──→ A.4
                           │
                           ▼
Task B.1 ──→ B.2 ──→ B.3 ──→ B.4
                           │
Task C.1 ──→ C.2 ──→ C.3 ──→ C.4
                           │
Task D.1 ──→ D.2 ──→ D.3 ──→ D.4 ──→ D.5
```

**并行度**: Phase B、C、D 可并行开发，但需等 Phase A 完成

---

## 九、下一步

1. **用户批准本计划**
2. **确定实施顺序**（建议 A → B → C → D 或 A → B+D 并行 → C）
3. **开始 Phase A: Task A.1 数据库类型扩展**
