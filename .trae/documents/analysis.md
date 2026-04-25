# Eric 知识库 - 问题分析与优化方向

> **分析日期**: 2026-04-24
> **基于**: 代码审查 + 功能测试

---

## 一、现有问题（Critical Issues）

### 1.1 练习流程与复习系统断连

**问题**: `practice/page.tsx` 答题后不会创建 `ReviewSchedule`

```typescript
// 当前：只创建 wrongQuestion，没有创建复习计划
await db.wrongQuestions.add({
  id: crypto.randomUUID(),
  userId: currentUser?.id || "",
  questionId: currentQ.id,
  ...
})

// 缺失：应该同时创建 ReviewSchedule
await db.reviewSchedules.add({
  id: crypto.randomUUID(),
  userId: currentUser?.id || "",
  questionId: currentQ.id,
  easeFactor: 2.5,  // SM-2 默认值
  interval: 0,
  repetitions: 0,
  nextReviewDate: new Date(),  // 立即需要复习
  lastReviewDate: null,
})
```

**影响**: 复习计划页面永远是空的，SM-2 算法无法生效

**修复优先级**: 🔴 最高

---

### 1.2 答题时间未被追踪

**问题**: `timeSpent` 固定为 0，无法用于 SM-2 质量计算

```typescript
// 当前代码
await db.userAnswers.add({
  ...
  timeSpent: 0,  // 硬编码为 0
})
```

**影响**: 无法根据答题速度判断掌握程度

**修复优先级**: 🔴 高

---

### 1.3 新组件未被使用

| 组件 | 状态 | 问题 |
|-----|------|------|
| `Heatmap` | 已创建 | Stats 页面未集成 |
| `RadarChart` | 已创建 | Stats 页面未集成 |
| `FlashCard` | 已创建 | 只在 `/cards/review` 使用 |
| `Progress` | 已创建 | 只在 `/cards/review` 使用 |
| `daily-stats` | 已创建 | Stats 页面手动计算 |
| `weakness-detector` | 已创建 | Stats 页面手动计算 |

**修复优先级**: 🟡 中

---

### 1.4 闪卡系统与知识点断连

**问题**:
- 无法从知识点详情页创建闪卡
- 无法从错题创建闪卡
- 闪卡复习没有使用 SM-2 算法

**修复优先级**: 🟡 中

---

## 二、优化方向（价值排序）

### 方向 A: 让复习系统真正生效 ⭐⭐⭐

**核心问题**: SM-2 算法和复习计划是"假"的，因为根本没人调用

**需要修复**:
1. Practice 答题后创建 ReviewSchedule
2. ReviewSchedule 需要记录每次复习的 SM-2 参数
3. 下次复习时更新 SM-2 参数
4. 复习页面需要有完整的答题 → 反馈 → 更新复习计划的闭环

**文件变更**:
- `src/app/practice/page.tsx` - 添加 ReviewSchedule 创建
- `src/app/review/page.tsx` - 完整 SM-2 闭环
- `src/lib/algorithms/sm2.ts` - 可能需要增强

---

### 方向 B: 数据可视化升级 ⭐⭐⭐

**核心问题**: Stats 页面是手动计算的，没有用新组件

**需要修复**:
1. Stats 页面集成 Heatmap 组件（学习日历）
2. Stats 页面集成 RadarChart 组件（学科能力图）
3. 使用 `daily-stats.ts` 预计算聚合数据
4. 使用 `weakness-detector.ts` 计算薄弱点

**文件变更**:
- `src/app/stats/page.tsx` - 集成新组件
- `src/lib/analytics/daily-stats.ts` - 确保方法完整

---

### 方向 C: 学习目标系统 ⭐⭐

**核心问题**: 有数据模型，没有 UI

**需要实现**:
1. `/goals` 页面 - 创建/查看学习目标
2. 目标类型：每日答题数、连续学习天数、知识点掌握度
3. 首页仪表盘显示今日目标进度
4. 目标达成奖励动画

**文件变更**:
- `src/app/goals/page.tsx` - 新建
- `src/app/page.tsx` - 集成目标进度

---

### 方向 D: 闪卡生态完善 ⭐⭐

**核心问题**: 闪卡是孤立的，没有和练习/复习打通

**需要实现**:
1. 知识点详情页添加"创建闪卡"按钮
2. 错题详情页添加"创建闪卡"按钮
3. 闪卡复习使用 SM-2 算法（类似题目复习）
4. 闪卡支持音频/图片（未来）

**文件变更**:
- `src/app/knowledge/resources/page.tsx` - 添加闪卡入口
- `src/app/wrong/page.tsx` - 添加闪卡入口
- `src/app/cards/review/page.tsx` - SM-2 集成

---

### 方向 E: 用户体验细节优化 ⭐

**优化项**:
1. 侧边栏分组显示（学习/内容/工具）
2. 首页仪表盘动态统计（真实数据）
3. 加载状态骨架屏
4. 空状态引导（没有数据时教用户做什么）
5. 移动端适配优化

**文件变更**:
- `src/components/layout/app-layout.tsx` - 侧边栏分组
- `src/app/page.tsx` - 动态数据
- 各页面空状态

---

### 方向 F: 中考垂直场景深化 ⭐

**针对中考备考的特色功能**:

1. **备考冲刺视图**
   - 倒计时（距离中考天数）
   - 重点知识点清单
   - 高频考点标注

2. **真题模式**
   - 导入真实中考题
   - 按年份/省份筛选
   - 真题练习模式

3. **知识点考频**
   - 标记哪些知识点是高频考点
   - 优先练习高频考点

**文件变更**: 新增功能模块

---

## 三、6 窗口并行任务建议

### 窗口分配方案

| 窗口 | 方向 | 任务 | 文件 |
|-----|------|------|------|
| **1** | A - 复习闭环 | 修复 Practice 答题后创建 ReviewSchedule + Review 页面 SM-2 闭环 | `practice/page.tsx`, `review/page.tsx` |
| **2** | B - 数据可视化 | Stats 页面集成 Heatmap + RadarChart | `stats/page.tsx` |
| **3** | C - 学习目标 | Goals 页面 + 首页目标进度 | `goals/page.tsx`, `page.tsx` |
| **4** | D - 闪卡生态 | 知识点/错题页添加闪卡入口 + 闪卡 SM-2 | `knowledge/resources/page.tsx`, `wrong/page.tsx`, `cards/review/page.tsx` |
| **5** | E - UX 优化 | 侧边栏分组 + 动态统计 + 空状态 | `app-layout.tsx`, 各页面 |
| **6** | 集成测试 | 确保所有新功能联调正常 + 修复 bug | 全部 |

---

## 四、技术债务

### 4.1 待清理代码

| 问题 | 位置 | 说明 |
|-----|------|------|
| 重复的计算逻辑 | `stats/page.tsx` | 手动计算 weak points，应用 `weakness-detector.ts` |
| 硬编码值 | 多处 | `timeSpent: 0`、难度默认值 |
| 未使用的 import | 多处 | 代码审查发现 |

### 4.2 数据库优化

- 缺少索引：`questions.tags` 可能有复合查询需求
- 迁移脚本：`migrations.ts` 被创建但未在启动时调用

### 4.3 错误处理

- 大部分 async 操作没有 try-catch
- 用户操作失败没有 toast 提示

---

## 五、推荐实施顺序

```
第一优先级（必须修复）:
├── 1. Practice → ReviewSchedule 集成
├── 2. Review 页面 SM-2 闭环
└── 3. Stats 页面使用 weakness-detector

第二优先级（价值实现）:
├── 4. Stats 页面集成 Heatmap/RadarChart
├── 5. 学习目标系统
└── 6. 闪卡与知识点/错题联动

第三优先级（体验优化）:
├── 7. 侧边栏分组
├── 8. 空状态引导
└── 9. 移动端适配
```

---

## 六、下一步行动

1. **立即修复**: Practice + ReviewSchedule 断连问题
2. **集成新组件**: Stats 页面使用新图表组件
3. **创建 Goals 页面**: 完整的学习目标系统
4. **完善闪卡生态**: 与知识点/错题联动
5. **UX 优化**: 侧边栏、空状态、动画
