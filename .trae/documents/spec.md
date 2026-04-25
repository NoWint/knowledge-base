# 知识库学习系统 - 技术规格文档 (Spec)

## 1. 项目概述

### 1.1 项目名称
知识库学习系统 (Knowledge Base Learning System)

### 1.2 项目定位
一个纯前端、零后端的个人知识库和学习系统，支持初中全学科，部署于 GitHub Pages。

### 1.3 核心特性
- ✅ 100% 纯前端，无需服务器
- ✅ 数据存储在浏览器 IndexedDB
- ✅ 本地多用户切换
- ✅ 完整的学习系统功能
- ✅ 可直接部署到 GitHub Pages

### 1.4 技术栈
| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | Next.js | 15 | 应用框架（静态导出） |
| 运行时 | React | 19 | UI 库 |
| 语言 | TypeScript | 5.x | 类型安全 |
| 样式 | Tailwind CSS | 4.x | 原子化 CSS |
| UI 组件 | shadcn/ui | latest | 组件库 |
| 动画 | Framer Motion | 11.x | 动画效果 |
| 状态管理 | Zustand | 5.x | 轻量状态管理 |
| 本地数据库 | Dexie.js | 4.x | IndexedDB 封装 |
| 图表 | Recharts | 2.x | 数据可视化 |
| 思维导图 | @xyflow/react | 12.x | 知识图谱 |
| Markdown | react-markdown | 9.x | 内容渲染 |
| 文件处理 | browser-fs-access | latest | 文件导入导出 |

## 2. 功能规格

### 2.1 用户系统 (MVP-1)

#### 2.1.1 本地多用户
- 创建用户：昵称 + 头像（可选）
- 切换用户：下拉菜单快速切换
- 编辑用户：修改昵称/头像
- 删除用户：确认后删除该用户所有数据
- 首次引导：创建第一个用户时引导选择年级/学科

#### 2.1.2 用户配置
- 年级选择：初一、初二、初三
- 学科选择：多选学科
- 偏好设置：主题、语言等（后续扩展）

### 2.2 学科内容系统 (MVP-2)

#### 2.2.1 学科目录
- 树形结构展示（学科 → 册 → 章 → 节 → 知识点）
- 支持展开/折叠
- 进度标记（已学/未学）
- 快速搜索知识点

#### 2.2.2 内容展示
- Markdown 渲染文章
- 文章类型：教学/概述/学习方法/真题分析
- 关联知识点
- 面包屑导航

#### 2.2.3 思维导图
- 可视化展示知识点关系
- 交互式节点展开
- 支持缩放/拖拽

### 2.3 题库系统 (MVP-3)

#### 2.3.1 题库管理
- 按学科/章节/知识点/难度分类
- 题目类型：单选、多选、填空、判断、解答
- 题目字段：内容、答案、解析、难度、来源

#### 2.3.2 练习模式
1. **自由练习**：随机出题，无时间限制
2. **专项训练**：指定知识点练习
3. **模拟考试**：限时，按试卷结构
4. **错题重做**：仅练习错题
5. **闯关模式**：难度递增（后续）

#### 2.3.3 答题功能
- 题目展示（支持富文本）
- 选项选择（单选/多选）
- 文本输入（填空/解答）
- 即时判分
- 答案解析展示
- 标记题目（收藏/疑难）

#### 2.3.4 错题本
- 自动记录错题
- 错误次数统计
- 订正状态：未订正/已订正/已掌握
- 重做功能
- 按学科/知识点筛选

### 2.4 数据分析 (MVP-4)

#### 2.4.1 统计面板
- 总答题数/正确率
- 各学科正确率
- 知识点正确率热力图
- 答题趋势折线图
- 错题分布饼图

#### 2.4.2 学习报告
- 日/周/月学习统计
- 薄弱知识点分析
- 进步趋势
- 学习时长（可选）

### 2.5 文件管理系统 (MVP-5)

#### 2.5.1 文件操作
- 上传文件（PDF、Word、图片等）
- 文件夹管理（创建/重命名/移动/删除）
- 文件预览（图片、PDF）
- 文件下载

#### 2.5.2 文件组织
- 标签系统
- 关联知识点
- 搜索/筛选
- 批量操作

### 2.6 数据导入导出 (MVP-6)

#### 2.6.1 导出功能
- 全量数据导出（JSON）
- 按模块导出（题库/错题/文件等）
- Excel 导出（题库）

#### 2.6.2 导入功能
- JSON 导入（恢复备份）
- Excel 导入（题库）
- 增量导入（合并数据）

### 2.7 知识图谱 (MVP-7)

#### 2.7.1 关联关系
- 前驱知识点
- 后继知识点
- 相关知识点（跨学科）
- 扩展内容

#### 2.7.2 可视化
- 节点关系图
- 交互式探索
- 关联题目推荐

## 3. 数据规格

### 3.1 IndexedDB 结构

数据库名：`KnowledgeBaseDB`

#### 3.1.1 全局数据 Stores
这些 Stores 存储系统级别数据，所有用户共享：

```typescript
subjects: 'id, name, gradeLevel, orderIndex'
chapters: 'id, subjectId, parentId, orderIndex'
knowledgePoints: 'id, chapterId, name, difficulty'
articles: 'id, knowledgePointId, type, createdAt'
questions: 'id, knowledgePointId, type, difficulty'
questionOptions: 'id, questionId, label, isCorrect'
testPapers: 'id, name, subjectId'
testPaperQuestions: 'id, testPaperId, questionId, orderIndex'
knowledgeRelations: 'id, sourceKpId, targetKpId, relationType'
```

#### 3.1.2 用户数据 Stores
这些 Stores 存储用户级别数据，按 userId 隔离：

```typescript
users: 'id, name, createdAt'
userProfiles: 'id, userId, currentGrade'
userSubjects: 'id, userId, subjectId'
userAnswers: 'id, userId, questionId, answeredAt, isCorrect'
wrongQuestions: 'id, userId, questionId, status, lastWrongAt'
userFiles: 'id, userId, folderId, fileName, fileType, createdAt'
fileFolders: 'id, userId, parentId, folderName'
fileTags: 'id, userId, tagName'
fileKnowledgeLinks: 'id, fileId, knowledgePointId'
```

### 3.2 数据关系

```
全局数据 (所有用户共享)
├── subjects (学科)
│   └── chapters (章节)
│       └── knowledgePoints (知识点)
│           ├── articles (文章)
│           ├── questions (题目)
│           │   └── questionOptions (选项)
│           └── knowledgeRelations (知识关联)
└── testPapers (试卷)
    └── testPaperQuestions (试卷题目)

用户数据 (按 userId 隔离)
├── users (用户)
│   └── userProfiles (配置)
│       └── userSubjects (学科偏好)
├── userAnswers (答题记录)
├── wrongQuestions (错题本)
└── userFiles (文件)
    ├── fileFolders (文件夹)
    ├── fileTags (标签)
    └── fileKnowledgeLinks (知识点关联)
```

### 3.3 数据量估算

| 数据类型 | 单条大小 | 预估数量 | 总大小 |
|---------|---------|---------|--------|
| 学科 | ~200B | 30 | 6KB |
| 章节 | ~300B | 200 | 60KB |
| 知识点 | ~500B | 1000 | 500KB |
| 题目 | ~1KB | 5000 | 5MB |
| 文章 | ~2KB | 500 | 1MB |
| 用户答题 | ~200B | 10000 | 2MB |
| 文件 | ~500KB | 100 | 50MB |
| **总计** | - | - | **~60MB** |

浏览器 IndexedDB 限制通常为 50-100MB（各浏览器不同），需注意文件存储优化。

## 4. UI/UX 规格

### 4.1 设计规范

#### 4.1.1 色彩系统
```css
主色调: blue-600 (#2563eb)
次要色: indigo-600 (#4f46e5)
成功色: green-600 (#16a34a)
警告色: amber-600 (#d97706)
错误色: red-600 (#dc2626)
背景色: slate-50 (#f8fafc)
```

#### 4.1.2 圆角
- 小圆角: 8px
- 中圆角: 12px
- 大圆角: 16px

#### 4.1.3 阴影
- 小阴影: 0 1px 2px rgba(0,0,0,0.05)
- 中阴影: 0 4px 6px rgba(0,0,0,0.07)
- 大阴影: 0 10px 15px rgba(0,0,0,0.1)

### 4.2 布局规范

#### 4.2.1 响应式断点
- 手机: < 640px
- 平板: 640px - 1024px
- 桌面: > 1024px

#### 4.2.2 页面布局
- 左侧边栏: 250px（桌面），可折叠
- 顶部导航: 64px
- 内容区: 自适应

### 4.3 动画规范

#### 4.3.1 页面切换
- 类型: 淡入淡出 + 轻微滑动
- 时长: 200ms
- 缓动: ease-out

#### 4.3.2 交互反馈
- 按钮点击: 缩放 0.95
- 卡片悬停: 上浮 2px + 阴影增强
- 加载: 骨架屏

#### 4.3.3 状态动画
- 答题正确: 绿色勾选 + 弹跳
- 答题错误: 红色叉号 + 抖动
- 成就解锁: 烟花/星光效果

## 5. 性能规格

### 5.1 加载性能
- 首屏加载: < 2s（3G 网络）
- 页面切换: < 200ms
- 数据查询: < 100ms（IndexedDB）

### 5.2 存储性能
- 单次查询: < 50ms
- 批量插入: < 200ms
- 文件上传: 根据文件大小

### 5.3 内存管理
- 大文件按需加载
- 列表虚拟化（长列表）
- 组件懒加载

## 6. 安全规格

### 6.1 数据安全
- 数据完全本地存储
- 无网络传输
- 浏览器沙盒保护

### 6.2 用户隔离
- 逻辑隔离（通过 userId 过滤）
- 浏览器隔离（不同域名 IndexedDB 隔离）

### 6.3 备份安全
- 导出文件仅包含用户数据
- 支持密码保护（可选，后期）

## 7. 兼容性规格

### 7.1 浏览器支持
- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

### 7.2 设备支持
- 桌面浏览器
- 平板浏览器
- 手机浏览器
- PWA 安装支持

## 8. 部署规格

### 8.1 构建配置
```javascript
// next.config.js
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};
```

### 8.2 GitHub Pages
- 构建产物: `out/` 目录
- 部署方式: GitHub Actions 自动部署
- 自定义域名: 支持

### 8.3 本地开发
```bash
npm run dev    # 开发服务器
npm run build  # 生产构建
npm run export # 静态导出
```

## 9. MVP 阶段定义

### MVP-1 (Week 1-2): 基础架构
- 项目初始化
- 本地用户系统
- 基础布局
- 首页仪表盘

### MVP-2 (Week 3-4): 内容系统
- 学科目录
- 知识点浏览
- 文章展示
- 种子数据

### MVP-3 (Week 5-6): 题库系统
- 题目展示
- 练习模式
- 答题记录
- 错题本

### MVP-4 (Week 7-8): 数据分析
- 统计面板
- 图表展示
- 学习报告

### MVP-5 (Week 9-10): 文件管理
- 文件上传
- 文件夹管理
- 文件预览

### MVP-6 (Week 11): 导入导出
- 数据导出
- 数据导入
- 备份恢复

### MVP-7 (Week 12+): 知识图谱
- 知识关联
- 图谱可视化
- 关联推荐

## 10. 验收标准

### 10.1 功能验收
- [ ] 所有核心功能正常工作
- [ ] 数据正确存储到 IndexedDB
- [ ] 用户切换数据隔离
- [ ] 导入导出数据完整

### 10.2 性能验收
- [ ] 首屏加载 < 2s
- [ ] 页面切换流畅
- [ ] 大数据量查询不卡顿

### 10.3 兼容性验收
- [ ] 主流浏览器正常显示
- [ ] 移动端适配良好
- [ ] PWA 可安装

### 10.4 部署验收
- [ ] 成功构建静态文件
- [ ] GitHub Pages 正常访问
- [ ] 无控制台错误
