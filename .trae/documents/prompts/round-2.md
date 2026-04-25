# 6 对话并行执行 - 第二轮（整合 + 核心功能）

## 核心问题修复

本轮重点修复「复习系统断连」问题，让 SM-2 算法真正生效。

---

## 对话 1: Practice → ReviewSchedule 断连修复

**提示词**:

```
请修复练习系统与复习系统的断连问题。

## 问题
当前 `src/app/practice/page.tsx` 答题后只创建 `wrongQuestion`，没有创建 `ReviewSchedule`，导致：
1. `/review` 页面永远为空
2. SM-2 算法无法生效

## 修复任务

### 1. 修改 checkAnswer 函数

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
  nextReviewDate: new Date(),  // 立即复习
  lastReviewDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
})
```

### 2. 添加计时功能

在组件中添加状态来追踪答题时间：

```typescript
const [startTime, setStartTime] = useState<number>(Date.now())

// 在 startPractice 函数中重置计时
setStartTime(Date.now())

// 在 checkAnswer 函数中计算耗时
const timeSpent = Math.round((Date.now() - startTime) / 1000)
```

### 3. 确保 db.reviewSchedules 导入正确

检查文件的 db 导入是否包含 reviewSchedules。

完成后确保 TypeScript 编译无错误。
```

---

## 对话 2: Review 页面 SM-2 闭环

**提示词**:

```
请重写 `src/app/review/page.tsx`，实现完整的 SM-2 复习闭环。

## 问题
当前复习页面是简化版，没有完整的答题 → SM-2 计算 → 更新复习计划的流程。

## 修复任务

### 重写复习页面，实现：

1. **加载待复习题目** - 从 `reviewSchedules` 表获取今日待复习的题目
2. **答题流程** - 完整答题 UI，参考 `practice/page.tsx`
3. **SM-2 计算** - 根据答题质量计算下一次复习时间
4. **更新 ReviewSchedule** - 保存新的 SM-2 参数

### 关键代码逻辑

```typescript
import { calculateSM2, mapAnswerToQuality } from '@/lib/algorithms/sm2'

// 答题后计算 SM-2
async function submitAnswer(isCorrect: boolean) {
  const schedule = currentSchedule
  const quality = mapAnswerToQuality(isCorrect, timeSpent, estimatedTime)
  
  const result = calculateSM2({
    quality,
    easeFactor: schedule.easeFactor,
    interval: schedule.interval,
    repetitions: schedule.repetitions,
  })
  
  // 更新 ReviewSchedule
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

### UI 要求
- 显示进度条
- 显示答对/答错状态
- 显示答案解析
- 完整的动画效果

完成后确保 TypeScript 编译无错误。
```

---

## 对话 3: Stats 页面集成新组件

**提示词**:

```
请重写 `src/app/stats/page.tsx`，集成新创建的图表组件。

## 需要集成的组件

### 1. Heatmap 组件
```typescript
import { Heatmap } from '@/components/charts/heatmap'
```

### 2. RadarChart 组件
```typescript
import { RadarChart } from '@/components/charts/radar-chart'
```

### 3. 使用 weakness-detector
```typescript
import { detectWeakPoints } from '@/lib/algorithms/weakness-detector'
```

### 4. 使用 daily-stats
```typescript
import { getHeatmapData } from '@/lib/analytics/daily-stats'
```

## 修复任务

### 1. 导入新组件

### 2. 使用 getHeatmapData 获取热力图数据
```typescript
const heatmapData = await getHeatmapData(currentUser.id, 90)
```

### 3. 使用 detectWeakPoints 获取薄弱点
```typescript
const weakPoints = await detectWeakPoints(currentUser.id, 3)
```

### 4. 使用 RadarChart 显示学科能力
需要按学科计算掌握度，传给 RadarChart

### 5. 保留现有图表逻辑
- 趋势图 (LineChart)
- 学科正确率 (BarChart)
- 错题分布 (PieChart)
- 难度正确率 (BarChart)

## 布局建议

```
┌─────────────────────────────────────────┐
│  4个统计卡片 (总答题/正确率/待订正/连续)  │
├─────────────────────────────────────────┤
│  学习热力图 (90天)                       │
├───────────────────────┬─────────────────┤
│  近7天趋势图           │  学科能力雷达图  │
├───────────────────────┴─────────────────┤
│  薄弱知识点列表 (使用 detectWeakPoints)   │
└─────────────────────────────────────────┘
```

完成后确保 TypeScript 编译无错误。
```

---

## 对话 4: 学习目标系统

**提示词**:

```
请创建 `src/app/goals/page.tsx`，实现学习目标系统。

## 需求

### 1. 目标类型
- `daily_questions`: 每日答题数目标
- `weekly_streak`: 连续学习天数
- `mastery_level`: 知识点掌握度

### 2. 页面功能

```typescript
// 目标结构
interface LearningGoal {
  id: string
  userId: string
  type: GoalType  // 'daily_questions' | 'weekly_streak' | 'mastery_level'
  targetValue: number  // 目标值
  currentValue: number  // 当前进度
  startDate: Date
  endDate: Date
  status: GoalStatus  // 'active' | 'completed' | 'expired'
}
```

### 3. UI 要求

1. **目标列表** - 显示所有目标及进度条
2. **创建目标** - 弹出表单创建新目标
3. **进度追踪** - 实时更新当前进度
4. **目标状态** - active/completed/expired

### 4. 样式参考
参考 `practice/page.tsx` 的卡片风格

### 5. 进度计算逻辑

```typescript
// 每日答题目标 - 从 userAnswers 计算今日答题数
const todayAnswers = await db.userAnswers
  .where('userId').equals(userId)
  .filter(a => isToday(a.answeredAt))
  .count()

// 连续学习天数 - 从 dailyStats 计算
// 知识点掌握度 - 使用 calculateMasteryLevel
```

完成后确保 TypeScript 编译无错误。
```

---

## 对话 5: 闪卡与知识点联动

**提示词**:

```
请修改两个页面，添加闪卡创建入口。

## 修改 1: src/app/knowledge/resources/page.tsx

在知识点详情页添加「创建闪卡」按钮。

### 添加位置
在「相关练习」区域下方添加「学习闪卡」区域。

### 代码逻辑
```typescript
async function createFlashCard() {
  const front = knowledgePoint.name
  const back = knowledgePoint.description || knowledgePoint.content?.slice(0, 200) || ''
  
  await db.flashCards.add({
    id: crypto.randomUUID(),
    knowledgePointId: knowledgePoint.id,
    front,
    back,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  
  alert('闪卡已创建！')
}
```

### UI
在相关练习区域后添加：
```tsx
<button onClick={createFlashCard} className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm">
  📚 创建学习闪卡
</button>
```

---

## 修改 2: src/app/wrong/page.tsx

在错题详情展开区域添加「创建闪卡」按钮。

### 代码逻辑
```typescript
async function createFlashCardFromWrong(wq: WrongQuestion & { question: Question }) {
  await db.flashCards.add({
    id: crypto.randomUUID(),
    knowledgePointId: wq.question.knowledgePointId,
    front: wq.question.content.slice(0, 100),
    back: wq.question.answer,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}
```

完成后确保 TypeScript 编译无错误。
```

---

## 对话 6: 侧边栏分组 + 移动端优化

**提示词**:

```
请优化 `src/components/layout/app-layout.tsx`。

## 任务 1: 侧边栏分组显示

将导航项分组，让界面更清晰：

```typescript
const navItems = [
  // 学习模块
  { icon: Home, label: "首页", href: "/", group: "学习" },
  { icon: BookOpen, label: "学科目录", href: "/subjects", group: "学习" },
  { icon: Lightbulb, label: "知识中心", href: "/knowledge", group: "学习" },
  { icon: Network, label: "知识图谱", href: "/knowledge/graph", group: "学习" },
  
  // 练习模块
  { icon: PenTool, label: "练习题库", href: "/practice", group: "练习" },
  { icon: Target, label: "复习计划", href: "/review", group: "练习" },
  { icon: AlertCircle, label: "错题本", href: "/wrong", group: "练习" },
  { icon: Layers, label: "学习闪卡", href: "/cards", group: "练习" },
  
  // 数据模块
  { icon: BarChart3, label: "学习数据", href: "/stats", group: "数据" },
  
  // 工具模块
  { icon: FolderOpen, label: "资料库", href: "/files", group: "工具" },
  { icon: Upload, label: "数据导入", href: "/import", group: "工具" },
  { icon: Settings, label: "设置", href: "/settings", group: "工具" },
]

// 分组渲染
const groupedNavs = navItems.reduce((acc, item) => {
  if (!acc[item.group]) acc[item.group] = []
  acc[item.group].push(item)
  return acc
}, {} as Record<string, typeof navItems>)
```

### 分组标题样式
- 分组标题使用小字号灰色文字
- 分组之间有分隔线或间距

---

## 任务 2: 移动端适配

当前侧边栏在大屏幕上固定显示，小屏幕应该：
- 移动端（< 768px）默认隐藏
- 可通过汉堡菜单打开

```typescript
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

// 移动端断点检测
const isMobile = useBreakpoint('md')
```

完成后确保 TypeScript 编译无错误。
```

---

## 执行顺序建议

1. **对话 1 和 2 先完成** - 这是核心问题，必须先修复
2. **对话 3、4、5 可并行** - 功能性改进
3. **对话 6 最后完成** - UX 优化

## 完成后

运行 `npx tsc --noEmit` 确保无类型错误。
