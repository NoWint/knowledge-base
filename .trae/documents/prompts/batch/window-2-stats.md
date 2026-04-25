# 窗口 2: 数据可视化

## 任务概述
重写 Stats 页面，集成所有新创建的图表组件和数据处理函数。

## 完整任务列表

### Task 2.1: 集成 Heatmap 组件

**文件**: `src/app/stats/page.tsx`

```typescript
import { Heatmap } from '@/components/charts/heatmap'
import { getHeatmapData } from '@/lib/analytics/daily-stats'

// 在组件中使用
const heatmapData = await getHeatmapData(currentUser.id, 90)
```

### Task 2.2: 集成 RadarChart 组件

```typescript
import { RadarChart } from '@/components/charts/radar-chart'

// 按学科计算掌握度
const subjectMastery = subjects.map(subject => {
  const subjectChapterIds = chapters.filter(c => c.subjectId === subject.id).map(c => c.id)
  const kps = knowledgePoints.filter(kp => subjectChapterIds.includes(kp.chapterId))
  // 计算该学科下所有知识点的平均掌握度
  return {
    subject: subject.name,
    mastery: calculateAverageMastery(kps)
  }
})
```

### Task 2.3: 集成 weakness-detector

```typescript
import { detectWeakPoints } from '@/lib/algorithms/weakness-detector'

const weakPoints = await detectWeakPoints(currentUser.id, 3)
```

### Task 2.4: 替换手动计算的统计

当前 Stats 页面有手动计算 weak points 的代码，应该替换为使用 `weakness-detector.ts` 的函数。

### Task 2.5: 布局优化

建议布局：
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

### Task 2.6: 添加空状态处理

如果没有数据，显示引导用户开始学习的提示。

## 验收标准
1. 热力图显示过去 90 天的学习情况
2. 雷达图显示各学科能力分布
3. 薄弱点列表正确显示
4. 趋势图、饼图等其他图表保留
5. TypeScript 编译无错误

## 参考文件
- `src/components/charts/heatmap.tsx`
- `src/components/charts/radar-chart.tsx`
- `src/lib/algorithms/weakness-detector.ts`
- `src/lib/analytics/daily-stats.ts`
- `src/app/practice/page.tsx` (参考卡片样式)
