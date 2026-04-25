# 窗口 6: 清理与集成

## 任务概述
扫尾工作，确保所有功能联调正常，清理无用代码。

## 完整任务列表

### Task 6.1: 确保数据库迁移脚本正确

**文件**: `src/lib/db/database.ts`

检查并确保：
1. 所有新 stores 都已添加（reviewSchedules, flashCards, learningGoals, studySessions, dailyStats）
2. 升级逻辑正确处理旧数据

```typescript
db.version(1).stores({
  // ... 现有 stores
  reviewSchedules: 'id, userId, questionId, nextReviewDate',
  flashCards: 'id, knowledgePointId, createdAt',
  userFlashCardReviews: 'id, userId, flashCardId, nextReviewDate',
  learningGoals: 'id, userId, type, status',
  studySessions: 'id, userId, startTime, type',
  dailyStats: 'id, userId, date',
}).upgrade(tx => {
  // 升级旧数据
  return tx.table('wrongQuestions').toCollection().modify(wq => {
    if (!('wrongReason' in wq)) wq.wrongReason = null
    if (!('lastWrongReason' in wq)) wq.lastWrongReason = ''
  })
})
```

### Task 6.2: 检查路由配置

检查 `src/app/` 下的页面路由是否正确：
- `/review` → `src/app/review/page.tsx`
- `/cards` → `src/app/cards/page.tsx`
- `/cards/review` → `src/app/cards/review/page.tsx`
- `/goals` → `src/app/goals/page.tsx`（如果创建了）

### Task 6.3: 清理未使用的 import

检查各文件，删除未使用的 import：
```typescript
// 在 terminal 运行
cd src && grep -r "import.*unused" --include="*.tsx" --include="*.ts"
```

### Task 6.4: 确保 StatItem 类型正确

**文件**: `src/app/page.tsx`

确保 StatItem 组件的 icon 类型正确：
```typescript
function StatItem({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
})
```

### Task 6.5: 检查 null/undefined 处理

确保各页面的 async 操作有正确的空值处理：
- `if (!currentUser) return`
- `if (!data) return`
- try-catch 包裹所有 db 操作

### Task 6.6: 运行完整类型检查

```bash
npx tsc --noEmit
```

修复所有类型错误。

### Task 6.7: 构建测试

```bash
npm run build
```

确保生产构建正常。

### Task 6.8: 检查并更新项目文档

更新 `.trae/documents/expansion-plan.md`：
- 标记已完成的任务
- 添加新发现的问题

## 验收标准
1. TypeScript 编译无错误
2. `npm run build` 成功
3. 所有路由正确
4. 无明显运行时错误

## 执行顺序
1. 先 Task 6.6（类型检查）
2. 然后 Task 6.1（数据库）
3. Task 6.2（路由）
4. Task 6.3（清理）
5. Task 6.7（构建）
6. Task 6.8（文档）
