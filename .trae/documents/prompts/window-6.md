# 对话 6: 图表组件 + 每日统计

**提示词**:

```
请执行以下任务：

## 任务 D.1: 创建每日统计聚合逻辑

新建文件: `src/lib/analytics/daily-stats.ts`

```typescript
import { db } from '@/lib/db/database'

export async function calculateDailyStats(userId: string, date: string): Promise<{
  totalQuestions: number
  correctCount: number
  studyMinutes: number
  topicsCovered: string[]
}> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const answers = await db.userAnswers
    .where('userId').equals(userId)
    .filter(a => a.answeredAt >= startOfDay && a.answeredAt <= endOfDay)
    .toArray()

  const questions = await db.questions.toArray()
  const questionMap = new Map(questions.map(q => [q.id, q]))

  const topicsCoveredSet = new Set<string>()

  let correctCount = 0
  for (const answer of answers) {
    if (answer.isCorrect) correctCount++
    const question = questionMap.get(answer.questionId)
    if (question) {
      topicsCoveredSet.add(question.knowledgePointId)
    }
  }

  const sessions = await db.studySessions
    .where('userId').equals(userId)
    .filter(s => s.startTime >= startOfDay && s.startTime <= endOfDay && s.endTime)
    .toArray()

  let studyMinutes = 0
  for (const session of sessions) {
    if (session.endTime) {
      const duration = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000 / 60
      studyMinutes += duration
    }
  }

  return {
    totalQuestions: answers.length,
    correctCount,
    studyMinutes: Math.round(studyMinutes),
    topicsCovered: Array.from(topicsCoveredSet),
  }
}

export async function getWeeklyStats(userId: string): Promise<{ date: string; count: number; correct: number }[]> {
  const stats: { date: string; count: number; correct: number }[] = []
  const today = new Date()

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const dailyStats = await calculateDailyStats(userId, dateStr)
    stats.push({
      date: dateStr,
      count: dailyStats.totalQuestions,
      correct: dailyStats.correctCount,
    })
  }

  return stats
}

export async function getHeatmapData(userId: string, days = 90): Promise<{ date: string; value: number }[]> {
  const data: { date: string; value: number }[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const dailyStats = await calculateDailyStats(userId, dateStr)
    data.push({
      date: dateStr,
      value: dailyStats.totalQuestions,
    })
  }

  return data
}
```

完成后，确保 TypeScript 编译无错误。
```

---

```
## 任务 D.2: 创建学习热力图组件

新建文件: `src/components/charts/heatmap.tsx`

```tsx
"use client"

import { useMemo } from "react"

interface HeatmapProps {
  data: { date: string; value: number }[]
  maxValue?: number
}

export function Heatmap({ data, maxValue = 10 }: HeatmapProps) {
  const weeks = useMemo(() => {
    const result: { date: string; value: number }[][] = []
    let currentWeek: { date: string; value: number }[] = []

    for (let i = 0; i < data.length; i++) {
      currentWeek.push(data[i])
      if (currentWeek.length === 7 || i === data.length - 1) {
        result.push(currentWeek)
        currentWeek = []
      }
    }

    return result
  }, [data])

  const getColor = (value: number) => {
    if (value === 0) return 'bg-gray-100'
    const ratio = Math.min(value / maxValue, 1)
    if (ratio < 0.25) return 'bg-green-200'
    if (ratio < 0.5) return 'bg-green-300'
    if (ratio < 0.75) return 'bg-green-400'
    return 'bg-green-500'
  }

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-0.5">
            {week.map((day, dayIndex) => {
              const date = new Date(day.date)
              const monthLabel = dayIndex === 0 ? months[date.getMonth()] : ''
              return (
                <div key={dayIndex} className="relative group">
                  {monthLabel && (
                    <span className="absolute -top-4 left-0 text-xs text-gray-400">{monthLabel}</span>
                  )}
                  <div
                    className={`w-3 h-3 rounded-sm ${getColor(day.value)} transition-colors`}
                    title={`${day.date}: ${day.value} 题`}
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {day.date}: {day.value} 题
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
```

完成后，确保 TypeScript 编译无错误。
```

---

```
## 任务 D.3: 创建能力雷达图组件

新建文件: `src/components/charts/radar-chart.tsx`

```tsx
"use client"

import { useMemo } from "react"

interface RadarChartProps {
  data: { subject: string; mastery: number }[]
  size?: number
}

export function RadarChart({ data, size = 200 }: RadarChartProps) {
  const center = size / 2
  const maxRadius = size / 2 - 20

  const points = useMemo(() => {
    const angleStep = (2 * Math.PI) / data.length
    return data.map((item, index) => {
      const angle = angleStep * index - Math.PI / 2
      const radius = (item.mastery / 100) * maxRadius
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
        mastery: item.mastery,
        subject: item.subject,
      }
    })
  }, [data, center, maxRadius])

  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ')

  const gridLevels = [25, 50, 75, 100]

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {gridLevels.map(level => {
          const gridRadius = (level / 100) * maxRadius
          const gridPoints = data.map((_, index) => {
            const angleStep = (2 * Math.PI) / data.length
            const angle = angleStep * index - Math.PI / 2
            return `${center + gridRadius * Math.cos(angle)},${center + gridRadius * Math.sin(angle)}`
          }).join(' ')

          return (
            <polygon
              key={level}
              points={gridPoints}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          )
        })}

        {data.map((_, index) => {
          const angleStep = (2 * Math.PI) / data.length
          const angle = angleStep * index - Math.PI / 2
          const x2 = center + maxRadius * Math.cos(angle)
          const y2 = center + maxRadius * Math.sin(angle)
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          )
        })}

        <polygon
          points={polygonPoints}
          fill="rgba(139, 92, 246, 0.3)"
          stroke="#8b5cf6"
          strokeWidth="2"
        />

        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#8b5cf6"
            stroke="white"
            strokeWidth="2"
          />
        ))}
      </svg>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 max-w-[200px]">
        {data.map((item, index) => (
          <div key={index} className="text-xs text-gray-600">
            <span className="font-medium">{item.subject}</span>
            <span className="text-gray-400 ml-1">{item.mastery}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

完成后，确保 TypeScript 编译无错误。
```

---

```
## 任务: 创建 Progress UI 组件

检查 `src/components/ui/progress.tsx` 是否存在，如果不存在，创建它：

```tsx
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-gray-200",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-purple-500 transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
```

然后安装依赖：
```bash
npm install @radix-ui/react-progress
```
```

完成后，确保 TypeScript 编译无错误。
