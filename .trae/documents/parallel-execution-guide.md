# 并行执行指南

## 核心思路

将完整的实施计划拆分为 **4 个独立的工作包**，每个工作包可以在独立的对话中执行。

```
┌─────────────────────────────────────────────────────────┐
│  共享上下文（所有对话开始时加载）                          │
│  - src/types/database.ts (当前版本)                     │
│  - src/lib/db/database.ts (当前版本)                    │
│  - .trae/documents/expansion-plan.md                    │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   ┌─────────┐        ┌─────────┐        ┌─────────┐
   │ 对话 1  │        │ 对话 2  │        │ 对话 3  │
   │ Task    │        │ Task    │        │ Task    │
   │ A.1+A.2 │        │ A.3+A.4 │        │ B.1+B.2 │
   └─────────┘        └─────────┘        └─────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
              所有对话完成后 → Phase B/C/D
```

---

## 对话分配方案

### 对话 1: 数据库基础设施
**负责**: Task A.1 + A.2

**启动指令**:
```
请执行 expansion-plan.md 中的 Task A.1 和 Task A.2：
- Task A.1: 扩展 src/types/database.ts，添加新类型
- Task A.2: 创建 src/lib/db/migrations.ts 数据库迁移工具

完成后汇报。
```

**需要修改的文件**:
- `src/types/database.ts`
- `src/lib/db/migrations.ts` (新建)

---

### 对话 2: 算法实现
**负责**: Task A.3 + A.4

**启动指令**:
```
请执行 expansion-plan.md 中的 Task A.3 和 Task A.4：
- Task A.3: 创建 src/lib/algorithms/sm2.ts，实现 SM-2 间隔重复算法
- Task A.4: 创建 src/lib/algorithms/weakness-detector.ts，实现薄弱点检测

完成后汇报。
```

**需要修改的文件**:
- `src/lib/algorithms/sm2.ts` (新建)
- `src/lib/algorithms/weakness-detector.ts` (新建)

---

### 对话 3: 复习系统
**负责**: Task B.1 + B.2 + B.3

**启动指令**:
```
请执行 expansion-plan.md 中的 Task B.1、B.2 和 B.3：
- Task B.1: 创建 src/lib/notifications/review-notification.ts 复习提醒
- Task B.2: 创建 src/app/review/page.tsx 复习计划页面
- Task B.3: 重写 src/app/wrong/page.tsx 为错题本 2.0

完成后汇报。
```

**需要修改的文件**:
- `src/lib/notifications/review-notification.ts` (新建)
- `src/app/review/page.tsx` (新建)
- `src/app/wrong/page.tsx` (重写)

---

### 对话 4: 闪卡系统 + 数据分析
**负责**: Task C.1 + C.2 + D.1

**启动指令**:
```
请执行 expansion-plan.md 中的 Task C.1、C.2 和 D.1：
- Task C.1: 创建闪卡数据模型和 src/app/cards/page.tsx 页面
- Task C.2: 创建 src/components/cards/flash-card.tsx 翻转卡片组件
- Task D.1: 创建 src/lib/analytics/daily-stats.ts 每日统计逻辑

完成后汇报。
```

**需要修改的文件**:
- `src/app/cards/page.tsx` (新建)
- `src/components/cards/flash-card.tsx` (新建)
- `src/lib/analytics/daily-stats.ts` (新建)

---

## 共享上下文文件

每个对话开始时，读取以下文件获取当前代码状态：

| 文件 | 路径 |
|-----|------|
| 现有类型定义 | `src/types/database.ts` |
| 现有数据库 | `src/lib/db/database.ts` |
| 扩展计划 | `.trae/documents/expansion-plan.md` |
| 现有组件示例 | `src/app/practice/page.tsx` (参考风格) |

---

## 执行顺序建议

**第一波（可完全并行）**:
```
对话 1: Task A.1 + A.2
对话 2: Task A.3 + A.4
对话 3: Task B.1 + B.2 + B.3
对话 4: Task C.1 + C.2 + D.1
```

**第二波（等第一波完成后）**:
```
对话 1: Task B.4 (错题原因标注)
对话 2: Task C.3 + C.4 (闪卡复习 + 嵌入)
对话 3: Task D.2 + D.3 + D.4 (图表组件)
对话 4: Task D.5 (学习目标页面)
```

---

## 进度追踪

| 对话 | 负责 | 状态 | 负责人 |
|-----|------|------|--------|
| 对话 1 | Task A.1, A.2 | ⚪ 未开始 | - |
| 对话 2 | Task A.3, A.4 | ⚪ 未开始 | - |
| 对话 3 | Task B.1, B.2, B.3 | ⚪ 未开始 | - |
| 对话 4 | Task C.1, C.2, D.1 | ⚪ 未开始 | - |

---

## 冲突避免原则

1. **不同文件 = 互不干扰**：4 个对话修改的是完全不同的文件
2. **同名文件 = 需协调**：如果两个任务要改同一个文件，它们必须在同一个对话中
3. **最后汇总**：所有对话完成后，在一个新对话中处理整合测试

---

## 如何开始

1. **在 Trae IDE 中打开 4 个新标签页**
2. **每个标签页加载项目上下文**（告诉我"开始 Task A.1"）
3. **每个标签页独立执行分配的任务**
4. **完成后在主对话中汇报，我会更新进度**

---

**准备好了吗？** 告诉我你打开了几个对话，我可以开始分配任务。
