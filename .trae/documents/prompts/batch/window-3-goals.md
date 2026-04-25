# 窗口 3: 学习目标系统

## 任务概述
创建完整的学习目标页面和目标追踪逻辑。

## 完整任务列表

### Task 3.1: 创建 Goals 页面

**文件**: `src/app/goals/page.tsx`

创建完整的学习目标管理页面：

```typescript
"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { db } from "@/lib/db/database"
import { useUserStore } from "@/store/user-store"
import { motion, AnimatePresence } from "framer-motion"
import { Target, Plus, CheckCircle, Clock, TrendingUp, Flame } from "lucide-react"
import { smoothEase } from "@/lib/animations"
import type { LearningGoal } from "@/types"

export default function GoalsPage() {
  const { currentUser } = useUserStore()
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadGoals()
  }, [currentUser])

  async function loadGoals() {
    if (!currentUser) return
    setLoading(true)
    try {
      const allGoals = await db.learningGoals
        .where('userId').equals(currentUser.id)
        .toArray()
      setGoals(allGoals)
    } catch (err) {
      console.error('Failed to load goals:', err)
    } finally {
      setLoading(false)
    }
  }

  // ... 实现创建、删除、更新目标功能
}
```

### Task 3.2: 实现目标类型

支持三种目标类型：
- `daily_questions`: 每日答题数目标
- `weekly_streak`: 连续学习天数
- `mastery_level`: 知识点掌握度

### Task 3.3: 计算目标进度

```typescript
async function calculateGoalProgress(goal: LearningGoal): Promise<number> {
  switch (goal.type) {
    case 'daily_questions': {
      const today = new Date().toISOString().split('T')[0]
      const answers = await db.userAnswers
        .where('userId').equals(goal.userId)
        .filter(a => a.answeredAt.toISOString().startsWith(today))
        .count()
      return answers
    }
    case 'weekly_streak': {
      // 计算连续学习天数
      const stats = await db.dailyStats
        .where('userId').equals(goal.userId)
        .reverse()
        .sortBy('date')
      // 计算连续天数逻辑
      return calculateStreak(stats)
    }
    case 'mastery_level': {
      // 计算知识点掌握度
      const mastery = await calculateMasteryLevel(goal.userId, goal.targetId)
      return mastery
    }
  }
}
```

### Task 3.4: 目标状态管理

目标状态：
- `active`: 进行中
- `completed`: 已完成
- `expired`: 已过期

### Task 3.5: 首页集成目标进度

**文件**: `src/app/page.tsx`

在首页仪表盘显示当前活跃目标及进度：

```typescript
// 在首页添加目标进度展示
const activeGoal = goals.find(g => g.status === 'active')
if (activeGoal) {
  const progress = await calculateGoalProgress(activeGoal)
  const percent = Math.min(100, Math.round((progress / activeGoal.targetValue) * 100))
  // 显示进度条
}
```

### Task 3.6: 样式和动画

参考 `practice/page.tsx` 的卡片风格，确保：
- 目标创建表单美观
- 进度条有动画效果
- 目标完成时有庆祝动画

## 验收标准
1. 可以创建三种类型的学习目标
2. 目标进度实时计算
3. 目标状态正确流转
4. 首页显示当前活跃目标
5. TypeScript 编译无错误

## 参考文件
- `src/app/practice/page.tsx` (样式参考)
- `src/types/database.ts` (LearningGoal 类型)
