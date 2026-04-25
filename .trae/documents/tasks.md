# 知识库学习系统 - 开发任务清单 (Tasks)

## 全局规则
- 所有文件使用 TypeScript
- 组件使用函数式 + Hooks
- 样式使用 Tailwind CSS
- 状态管理使用 Zustand
- 数据库操作使用 Dexie.js

---

## Phase 1: 项目初始化与基础架构

### Task 1.1: 创建 Next.js 项目
**优先级**: P0
**依赖**: 无

**步骤**:
1. 初始化 Next.js 项目
   ```bash
   npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
   ```
2. 配置 `next.config.ts` 支持静态导出
3. 安装基础依赖
   ```bash
   npm install framer-motion zustand dexie recharts @xyflow/react
   npm install react-markdown rehype-highlight rehype-katex
   npm install browser-fs-access lucide-react clsx tailwind-merge
   ```
4. 配置 `tailwind.config.ts`
5. 配置路径别名 `@/*`

**验收**:
- [ ] `npm run dev` 正常启动
- [ ] 访问 localhost 显示 Next.js 默认页面

---

### Task 1.2: 安装配置 shadcn/ui
**优先级**: P0
**依赖**: Task 1.1

**步骤**:
1. 初始化 shadcn/ui
   ```bash
   npx shadcn@latest init
   ```
2. 安装基础组件
   ```bash
   npx shadcn@latest add button card dialog input select tabs badge avatar dropdown-menu progress separator sheet sidebar scroll-area tooltip alert skeleton
   ```
3. 验证组件正常工作

**验收**:
- [ ] shadcn 组件可正常导入使用
- [ ] 组件样式正常显示

---

### Task 1.3: 创建项目目录结构
**优先级**: P0
**依赖**: Task 1.1

**步骤**:
1. 创建以下目录结构：
   ```
   src/
   ├── app/
   │   ├── layout.tsx
   │   ├── page.tsx
   │   ├── globals.css
   │   └── (routes)/
   ├── components/
   │   ├── ui/           # shadcn 组件（自动生成）
   │   ├── layout/       # 布局组件
   │   ├── common/       # 通用组件
   │   └── features/     # 功能组件
   ├── lib/
   │   ├── db/           # 数据库
   │   ├── utils/        # 工具函数
   │   └── constants/    # 常量
   ├── store/            # Zustand stores
   ├── hooks/            # 自定义 hooks
   ├── types/            # TypeScript 类型
   └── data/             # 种子数据
   ```

**验收**:
- [ ] 目录结构完整创建
- [ ] 各目录可正常导入

---

### Task 1.4: 创建 TypeScript 类型定义
**优先级**: P0
**依赖**: Task 1.3

**步骤**:
1. 创建 `src/types/database.ts` - 数据库接口定义
2. 创建 `src/types/index.ts` - 统一导出

**文件内容**:
```typescript
// src/types/database.ts

// 全局数据
export interface Subject {
  id: string;
  name: string;
  icon: string;
  gradeLevel: string;
  description: string;
  orderIndex: number;
}

export interface Chapter {
  id: string;
  subjectId: string;
  parentId: string | null;
  name: string;
  orderIndex: number;
  description: string;
}

export interface KnowledgePoint {
  id: string;
  chapterId: string;
  name: string;
  description: string;
  difficulty: number;
  content: string;
}

export interface Question {
  id: string;
  knowledgePointId: string;
  type: 'single' | 'multiple' | 'fill' | 'judge' | 'essay';
  difficulty: number;
  content: string;
  answer: string;
  explanation: string;
  source: string;
}

// 用户数据
export interface User {
  id: string;
  name: string;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  currentGrade: string;
  preferences: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ... 其他接口
```

**验收**:
- [ ] 类型定义完整
- [ ] 无 TypeScript 编译错误

---

### Task 1.5: 创建 Dexie.js 数据库实例
**优先级**: P0
**依赖**: Task 1.4

**步骤**:
1. 创建 `src/lib/db/database.ts`
2. 定义所有 Stores 和 Schema
3. 创建初始化函数
4. 创建版本升级机制

**关键代码**:
```typescript
import Dexie, { type EntityTable } from 'dexie';
import type { User, Subject, Chapter, KnowledgePoint } from '@/types';

const db = new Dexie('KnowledgeBaseDB') as Dexie & {
  users: EntityTable<User, 'id'>;
  subjects: EntityTable<Subject, 'id'>;
  // ... 其他 stores
};

db.version(1).stores({
  users: 'id, name, createdAt',
  subjects: 'id, name, gradeLevel, orderIndex',
  // ...
});

export { db };
```

**验收**:
- [ ] 数据库实例正常创建
- [ ] Stores 定义正确
- [ ] 可正常进行增删改查

---

### Task 1.6: 创建用户状态管理 (Zustand)
**优先级**: P0
**依赖**: Task 1.5

**步骤**:
1. 创建 `src/store/user-store.ts`
2. 实现用户切换逻辑
3. 创建当前用户读取逻辑

**关键代码**:
```typescript
import { create } from 'zustand';
import { db } from '@/lib/db/database';
import type { User, UserProfile } from '@/types';

interface UserState {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  setCurrentUser: (user: User) => Promise<void>;
  clearCurrentUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  userProfile: null,
  isLoading: false,
  setCurrentUser: async (user) => {
    localStorage.setItem('currentUserId', user.id);
    const profile = await db.userProfiles.where('userId').equals(user.id).first();
    set({ currentUser: user, userProfile: profile || null });
  },
  clearCurrentUser: () => {
    localStorage.removeItem('currentUserId');
    set({ currentUser: null, userProfile: null });
  },
}));
```

**验收**:
- [ ] 用户切换正常工作
- [ ] 状态更新正确

---

### Task 1.7: 创建基础布局组件
**优先级**: P0
**依赖**: Task 1.2, 1.6

**步骤**:
1. 创建 `src/components/layout/app-layout.tsx`
   - 顶部导航栏 (Header)
   - 左侧边栏 (Sidebar)
   - 内容区域
2. 创建 `src/components/layout/header.tsx`
   - 用户切换下拉
   - 页面标题
   - 主题切换（后续）
3. 创建 `src/components/layout/sidebar.tsx`
   - 导航菜单
   - 功能入口
   - 可折叠

**验收**:
- [ ] 布局组件正常渲染
- [ ] 侧边栏可折叠
- [ ] 用户切换正常

---

### Task 1.8: 创建首页仪表盘
**优先级**: P0
**依赖**: Task 1.7

**步骤**:
1. 创建 `src/app/page.tsx`
2. 展示学习概览
3. 快捷入口卡片
4. 学习统计数据

**验收**:
- [ ] 首页正常显示
- [ ] 数据展示正确
- [ ] 响应式布局正常

---

## Phase 2: 学科内容系统

### Task 2.1: 创建学科种子数据
**优先级**: P1
**依赖**: Task 1.5

**步骤**:
1. 创建 `src/data/subjects.ts`
2. 包含初中所有学科数据
3. 包含章节层级结构
4. 创建数据初始化脚本

**数据结构**:
```typescript
export const subjectsData = [
  {
    id: 'chinese',
    name: '语文',
    icon: '📖',
    gradeLevel: '7-9',
    chapters: [
      {
        id: 'chinese-7-up',
        name: '七年级上册',
        sections: [...]
      }
    ]
  },
  // ...
];
```

**验收**:
- [ ] 数据格式正确
- [ ] 可成功导入数据库

---

### Task 2.2: 创建学科浏览页面
**优先级**: P1
**依赖**: Task 2.1

**步骤**:
1. 创建 `src/app/(dashboard)/subjects/page.tsx`
2. 学科卡片网格布局
3. 点击进入学科详情

**验收**:
- [ ] 学科列表正常显示
- [ ] 点击可导航

---

### Task 2.3: 创建知识点目录树
**优先级**: P1
**依赖**: Task 2.2

**步骤**:
1. 创建 `src/components/features/knowledge-tree.tsx`
2. 树形组件（递归）
3. 展开/折叠功能
4. 进度标记

**验收**:
- [ ] 树形结构正确渲染
- [ ] 交互功能正常

---

### Task 2.4: 创建文章内容展示
**优先级**: P1
**依赖**: Task 2.3

**步骤**:
1. 创建 `src/app/(content)/articles/[id]/page.tsx`
2. Markdown 渲染
3. 目录导航
4. 关联知识点展示

**验收**:
- [ ] 文章正常渲染
- [ ] Markdown 格式正确

---

## Phase 3: 题库系统

### Task 3.1: 创建题目种子数据
**优先级**: P1
**依赖**: Task 1.5

**步骤**:
1. 创建 `src/data/questions.ts`
2. 包含各类型题目示例
3. 包含选项数据

**验收**:
- [ ] 题目数据格式正确

---

### Task 3.2: 创建题目展示组件
**优先级**: P1
**依赖**: Task 3.1

**步骤**:
1. 创建 `src/components/features/question-card.tsx`
2. 支持所有题型展示
3. 选项交互
4. 答案展示

**验收**:
- [ ] 各题型正常显示
- [ ] 交互功能正常

---

### Task 3.3: 创建练习页面
**优先级**: P1
**依赖**: Task 3.2

**步骤**:
1. 创建 `src/app/(practice)/practice/page.tsx`
2. 练习模式选择
3. 题目切换
4. 答题提交

**验收**:
- [ ] 练习流程完整
- [ ] 答题功能正常

---

### Task 3.4: 创建答题记录逻辑
**优先级**: P1
**依赖**: Task 3.3

**步骤**:
1. 创建 `src/lib/db/queries.ts` - 查询函数
2. 创建 `src/lib/db/mutations.ts` - 增删改函数
3. 答题记录保存
4. 正确率计算

**验收**:
- [ ] 数据正确保存
- [ ] 查询功能正常

---

### Task 3.5: 创建错题本功能
**优先级**: P1
**依赖**: Task 3.4

**步骤**:
1. 创建 `src/app/(practice)/wrong/page.tsx`
2. 错题列表展示
3. 筛选功能
4. 重做功能

**验收**:
- [ ] 错题列表正常
- [ ] 重做功能正常

---

## Phase 4: 数据分析

### Task 4.1: 创建统计计算函数
**优先级**: P2
**依赖**: Task 3.4

**步骤**:
1. 创建 `src/lib/utils/statistics.ts`
2. 正确率计算
3. 趋势分析
4. 薄弱点分析

**验收**:
- [ ] 计算结果正确

---

### Task 4.2: 创建数据可视化组件
**优先级**: P2
**依赖**: Task 4.1

**步骤**:
1. 创建 `src/components/features/stats-cards.tsx`
2. 创建 `src/components/features/charts.tsx`
3. 折线图、饼图、柱状图

**验收**:
- [ ] 图表正常显示
- [ ] 数据绑定正确

---

## Phase 5: 文件管理

### Task 5.1: 创建文件上传组件
**优先级**: P2
**依赖**: Task 1.5

**步骤**:
1. 创建 `src/components/features/file-upload.tsx`
2. 拖拽上传
3. 文件预览
4. IndexedDB 存储

**验收**:
- [ ] 上传功能正常
- [ ] 文件正确存储

---

## Phase 6: 导入导出

### Task 6.1: 创建数据导出功能
**优先级**: P2

**步骤**:
1. 创建 `src/lib/export/json.ts`
2. 全量导出
3. 模块导出

**验收**:
- [ ] 导出文件正确

---

## Phase 7: UI 优化

### Task 7.1: 添加页面动画
**优先级**: P2

**步骤**:
1. 创建 `src/components/layout/page-transition.tsx`
2. Framer Motion 配置
3. 路由切换动画

**验收**:
- [ ] 动画流畅

---

## 任务依赖关系图

```
Phase 1: 基础架构
1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7 → 1.8
                                        ↓
Phase 2: 内容系统                    2.1 → 2.2 → 2.3 → 2.4
                                        ↓
Phase 3: 题库系统                    3.1 → 3.2 → 3.3 → 3.4 → 3.5
                                        ↓
Phase 4: 数据分析                          4.1 → 4.2
                                        ↓
Phase 5: 文件管理                          5.1
                                        ↓
Phase 6: 导入导出                          6.1
                                        ↓
Phase 7: UI 优化                           7.1
```
