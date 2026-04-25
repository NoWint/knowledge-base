# 窗口 1: SM-2 复习闭环（最关键）

## 任务概述
修复练习系统与复习系统的断连，让 SM-2 间隔重复算法真正生效。

## 完整任务列表

### Task 1.1: 修复 Practice 答题后创建 ReviewSchedule

**文件**: `src/app/practice/page.tsx`

找到 `checkAnswer` 函数，在创建 `wrongQuestion` 的同时创建 `ReviewSchedule`：

```typescript
// 在创建 wrongQuestion 后添加：
await db.reviewSchedules.add({
  id: crypto.randomUUID(),
  userId: currentUser?.id || "",
  questionId: currentQ.id,
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  nextReviewDate: new Date(),
  lastReviewDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
})
```

### Task 1.2: 添加答题计时

在组件中添加状态追踪答题时间：

```typescript
// 添加状态
const [startTime, setStartTime] = useState<number>(Date.now())

// 在 startPractice 函数中重置
setStartTime(Date.now())

// 在 checkAnswer 中计算耗时
const timeSpent = Math.round((Date.now() - startTime) / 1000)
```

### Task 1.3: 重写 Review 页面实现完整 SM-2 闭环

**文件**: `src/app/review/page.tsx`

完整实现：
1. 从 `reviewSchedules` 表加载今日待复习题目
2. 显示答题 UI
3. 根据答题质量计算 SM-2
4. 更新 ReviewSchedule 的下一次复习时间
5. 完成后显示统计

关键代码：
```typescript
import { calculateSM2, mapAnswerToQuality, QUALITY_LABELS } from '@/lib/algorithms/sm2'

async function submitAnswer(isCorrect: boolean) {
  const schedule = currentSchedule
  const quality = mapAnswerToQuality(isCorrect, timeSpent, currentQ.estimatedTime || 60)

  const result = calculateSM2({
    quality,
    easeFactor: schedule.easeFactor,
    interval: schedule.interval,
    repetitions: schedule.repetitions,
  })

  await db.reviewSchedules.update(schedule.id, {
    easeFactor: result.easeFactor,
    interval: result.interval,
    repetitions: result.repetitions,
    nextReviewDate: result.nextReviewDate,
    lastReviewDate: new Date(),
    updatedAt: new Date(),
  })
}
```

### Task 1.4: 在数据库类型中补充 ReviewSchedule 字段

**文件**: `src/types/database.ts`

确保 ReviewSchedule 接口包含所有字段：
```typescript
export interface ReviewSchedule {
  id: string
  userId: string
  questionId: string
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewDate: Date
  lastReviewDate: Date | null
  createdAt: Date  // 需要添加
  updatedAt: Date  // 需要添加
}
```

## 验收标准
1. 练习答题后，数据库 `reviewSchedules` 表有新记录
2. `/review` 页面能显示待复习题目
3. 完成复习后，SM-2 参数正确更新
4. TypeScript 编译无错误

## 执行顺序
1. 先做 Task 1.4（补充类型）
2. 然后 Task 1.1 + 1.2（Practice 修改）
3. 最后 Task 1.3（Review 页面）
