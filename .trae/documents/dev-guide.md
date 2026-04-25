# 知识库学习系统 - 开发规范 (Dev Guide)

## 1. 项目公约

### 1.1 核心原则
1. **纯前端优先**：所有功能必须在浏览器端完成，不依赖服务器
2. **数据本地化**：所有数据存储在 IndexedDB，不传输到外部
3. **类型安全**：所有代码使用 TypeScript，禁止使用 `any`
4. **组件化**：遵循 React 组件化最佳实践
5. **渐进式开发**：按 MVP 阶段逐步实现功能

### 1.2 技术约束
- Next.js 必须配置为 `output: 'export'`
- 不能使用 Server Components 调用服务端
- 不能使用 Server Actions
- 所有 API 调用改为 IndexedDB 操作
- 图片使用 `<Image>` 时必须配置 `unoptimized: true`

---

## 2. 代码规范

### 2.1 文件命名
- 组件文件: `kebab-case.tsx` (例: `question-card.tsx`)
- 工具文件: `kebab-case.ts` (例: `format-date.ts`)
- Store 文件: `kebab-case-store.ts` (例: `user-store.ts`)
- Hook 文件: `use-kebab-case.ts` (例: `use-user.ts`)
- 类型文件: `kebab-case.ts` (例: `database.ts`)

### 2.2 组件命名
- 组件名称: `PascalCase` (例: `QuestionCard`)
- Hook 名称: `usePascalCase` (例: `useUser`)
- 常量名称: `UPPER_SNAKE_CASE` (例: `MAX_FILE_SIZE`)

### 2.3 目录命名
- 目录名称: `kebab-case` (例: `question-cards/`)

### 2.4 路径别名
使用 `@/*` 代替相对路径：
```typescript
// ✅ 正确
import { db } from '@/lib/db/database';
import { Button } from '@/components/ui/button';

// ❌ 错误
import { db } from '../../lib/db/database';
```

### 2.5 组件结构
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Question } from '@/types';

interface QuestionCardProps {
  question: Question;
  onSubmit: (answer: string) => void;
}

export function QuestionCard({ question, onSubmit }: QuestionCardProps) {
  const [answer, setAnswer] = useState('');

  return (
    <div>
      <h3>{question.content}</h3>
      <Button onClick={() => onSubmit(answer)}>提交</Button>
    </div>
  );
}
```

### 2.6 状态管理
- 全局状态使用 Zustand
- 局部状态使用 React useState/useReducer
- 避免使用 Context API（除非必要）

```typescript
// ✅ 正确：Zustand store
import { create } from 'zustand';

interface UserState {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
}));
```

### 2.7 数据库操作
- 所有数据库操作封装在 `lib/db/` 目录下
- 查询函数放在 `queries.ts`
- 增删改函数放在 `mutations.ts`
- 使用 async/await

```typescript
// ✅ 正确：查询函数
export async function getQuestionsByKnowledgePoint(kpId: string) {
  return db.questions.where('knowledgePointId').equals(kpId).toArray();
}

// ✅ 正确：新增函数
export async function createAnswer(answer: Omit<UserAnswer, 'id' | 'answeredAt'>) {
  return db.userAnswers.add({
    ...answer,
    id: crypto.randomUUID(),
    answeredAt: new Date(),
  });
}
```

---

## 3. UI 开发规范

### 3.1 shadcn/ui 使用
- 组件放在 `src/components/ui/`
- 不要修改生成的组件源码
- 需要自定义样式时使用 wrapper 组件

```typescript
// ✅ 正确
import { Button } from '@/components/ui/button';

export function CustomButton() {
  return <Button className="bg-gradient-to-r from-blue-500 to-indigo-500">
    点击
  </Button>;
}
```

### 3.2 Tailwind 使用
- 优先使用 Tailwind 工具类
- 避免内联样式
- 复杂样式使用 `@apply`

```css
/* ✅ 正确：globals.css */
@layer components {
  .card-hover {
    @apply transition-all duration-200 hover:-translate-y-1 hover:shadow-lg;
  }
}
```

### 3.3 响应式设计
```typescript
// 使用 Tailwind 响应式前缀
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id}>{item.name}</Card>
  ))}
</div>
```

### 3.4 动画规范
```typescript
'use client';

import { motion } from 'framer-motion';

export function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
```

---

## 4. 数据库操作规范

### 4.1 命名规范
```typescript
// Store 名称: 小写复数
db.version(1).stores({
  users: 'id, name',
  userAnswers: 'id, userId, questionId',
});

// 字段名称: 小写驼峰
interface User {
  id: string;
  name: string;
  createdAt: Date;
}
```

### 4.2 查询规范
```typescript
// ✅ 正确：带过滤条件
const answers = await db.userAnswers
  .where('userId')
  .equals(userId)
  .and(a => a.isCorrect === false)
  .toArray();

// ❌ 错误：全表扫描后过滤
const answers = (await db.userAnswers.toArray())
  .filter(a => a.userId === userId && !a.isCorrect);
```

### 4.3 批量操作
```typescript
// ✅ 正确：使用 bulkAdd
await db.questions.bulkAdd(questionsArray);

// ❌ 错误：循环添加
for (const q of questionsArray) {
  await db.questions.add(q);
}
```

### 4.4 事务处理
```typescript
// ✅ 正确：使用事务
await db.transaction('rw', db.userAnswers, db.wrongQuestions, async () => {
  await db.userAnswers.add(answer);
  if (!answer.isCorrect) {
    await db.wrongQuestions.add(wrongQuestion);
  }
});
```

---

## 5. 错误处理规范

### 5.1 数据库错误
```typescript
export async function safeGetQuestions(kpId: string) {
  try {
    return await db.questions.where('knowledgePointId').equals(kpId).toArray();
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    return [];
  }
}
```

### 5.2 用户反馈
```typescript
// ✅ 正确：使用 toast 提示
import { toast } from 'sonner';

export async function handleDeleteUser(userId: string) {
  try {
    await deleteUser(userId);
    toast.success('用户已删除');
  } catch (error) {
    toast.error('删除失败，请重试');
  }
}
```

---

## 6. Git 工作流

### 6.1 分支命名
- 功能分支: `feature/task-name`
- 修复分支: `fix/bug-name`
- 优化分支: `refactor/name`

### 6.2 提交信息
遵循 Conventional Commits：
```
feat: 添加用户切换功能
fix: 修复答题记录保存问题
docs: 更新架构文档
style: 优化卡片样式
refactor: 重构数据库操作
```

---

## 7. 测试规范

### 7.1 单元测试（后期）
```typescript
import { describe, it, expect } from 'vitest';
import { calculateAccuracy } from '@/lib/utils/statistics';

describe('calculateAccuracy', () => {
  it('should return 100 for all correct answers', () => {
    expect(calculateAccuracy(5, 5)).toBe(100);
  });
  
  it('should return 0 for all wrong answers', () => {
    expect(calculateAccuracy(0, 5)).toBe(0);
  });
});
```

---

## 8. 性能优化规范

### 8.1 组件优化
```typescript
// ✅ 正确：使用 React.memo
export const QuestionCard = React.memo(({ question }: Props) => {
  return <div>{question.content}</div>;
});

// ✅ 正确：使用 useMemo
const filteredQuestions = useMemo(() => {
  return questions.filter(q => q.difficulty === difficulty);
}, [questions, difficulty]);
```

### 8.2 列表优化
```typescript
// ✅ 正确：使用虚拟列表
import { useVirtualizer } from '@tanstack/react-virtual';

export function QuestionList({ questions }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: questions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  });
  
  return (
    <div ref={parentRef}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div key={virtualRow.key} style={{ transform: `translateY(${virtualRow.start}px)` }}>
            <QuestionCard question={questions[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 9. 安全规范

### 9.1 数据验证
```typescript
// ✅ 正确：验证用户输入
function validateAnswer(answer: string, question: Question): boolean {
  if (!answer || answer.trim().length === 0) {
    throw new Error('答案不能为空');
  }
  return answer === question.answer;
}
```

### 9.2 文件大小限制
```typescript
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function validateFile(file: File): boolean {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件大小不能超过 ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
  return true;
}
```

---

## 10. 部署规范

### 10.1 构建检查
```bash
# 构建前检查
npm run lint
npm run build
npm run export

# 验证输出
ls -la out/
```

### 10.2 GitHub Pages 部署
- 产物目录: `out/`
- 部署分支: `gh-pages` 或 `main`
- 配置自定义域名（可选）

---

## 附录：常用命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 静态导出
npm run export

# 类型检查
npx tsc --noEmit

# 代码检查
npm run lint

# 格式化
npx prettier --write .
```
