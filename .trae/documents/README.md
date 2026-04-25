# 知识库学习系统 - 文档索引 (README)

## 📚 文档导航

本项目包含以下核心文档，所有开发工作将严格参照这些文档执行：

| 文档 | 路径 | 用途 |
|------|------|------|
| **架构设计** | [.trae/documents/个人知识库学习系统架构设计计划.md](.trae/documents/个人知识库学习系统架构设计计划.md) | 整体架构、技术选型、数据库设计 |
| **技术规格** | [.trae/documents/spec.md](.trae/documents/spec.md) | 功能规格、数据规格、性能要求 |
| **任务清单** | [.trae/documents/tasks.md](.trae/documents/tasks.md) | 开发任务分解、步骤、依赖关系 |
| **检查清单** | [.trae/documents/checklist.md](.trae/documents/checklist.md) | 各阶段验收标准 |
| **开发规范** | [.trae/documents/dev-guide.md](.trae/documents/dev-guide.md) | 代码规范、命名约定、最佳实践 |

---

## 🏗️ 项目概述

### 定位
一个纯前端、零后端的个人知识库和学习系统，支持初中全学科。

### 架构
```
GitHub Pages（静态前端）
    ↓
浏览器 IndexedDB（本地数据库）
    ├── Dexie.js（封装层）
    └── LocalStorage（轻量配置）
```

### 核心特性
- ✅ 100% 纯前端，无需服务器
- ✅ 本地多用户切换
- ✅ 完整题库系统
- ✅ 数据分析可视化
- ✅ 文件资料管理
- ✅ 知识图谱关联

### 技术栈
| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15 + React 19 + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| 动画 | Framer Motion |
| 状态 | Zustand |
| 数据库 | Dexie.js (IndexedDB) |
| 图表 | Recharts |
| 图谱 | @xyflow/react |

---

## 📋 开发阶段

### Phase 1: 基础架构 (Week 1-2)
- 项目初始化
- 本地用户系统
- 基础布局
- 首页仪表盘

### Phase 2: 内容系统 (Week 3-4)
- 学科目录
- 知识点浏览
- 文章展示

### Phase 3: 题库系统 (Week 5-6)
- 题目展示
- 练习模式
- 错题本

### Phase 4: 数据分析 (Week 7-8)
- 统计面板
- 图表展示

### Phase 5: 文件管理 (Week 9-10)
- 文件上传
- 文件夹管理

### Phase 6: 导入导出 (Week 11)
- 数据导出/导入

### Phase 7: 知识图谱 (Week 12+)
- 关联可视化
- 关联推荐

---

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build && npm run export
```

---

## 📁 项目结构

```
知识库/
├── src/
│   ├── app/                    # 页面路由
│   ├── components/
│   │   ├── ui/                 # shadcn 组件
│   │   ├── layout/             # 布局组件
│   │   └── features/           # 功能组件
│   ├── lib/
│   │   ├── db/                 # IndexedDB 操作
│   │   └── utils/              # 工具函数
│   ├── store/                  # Zustand 状态
│   ├── hooks/                  # 自定义 Hooks
│   ├── types/                  # TypeScript 类型
│   └── data/                   # 种子数据
└── public/                     # 静态资源
```

---

## 🔗 相关链接

- GitHub Pages: 待部署
- 架构设计: [个人知识库学习系统架构设计计划](.trae/documents/个人知识库学习系统架构设计计划.md)
- 技术规格: [spec](.trae/documents/spec.md)
- 任务清单: [tasks](.trae/documents/tasks.md)
- 开发规范: [dev-guide](.trae/documents/dev-guide.md)
