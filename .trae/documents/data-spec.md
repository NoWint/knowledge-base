# 知识库学习系统 - 学科数据规范

## 初中全学科目录

### 学科列表

| 学科 | 年级范围 | 代码 | 图标 |
|------|---------|------|------|
| 语文 | 7-9 | chinese | 📖 |
| 数学 | 7-9 | math | 🔢 |
| 英语 | 7-9 | english | 🅰️ |
| 物理 | 8-9 | physics | ⚡ |
| 化学 | 9 | chemistry | 🧪 |
| 生物 | 7-8 | biology | 🌱 |
| 历史 | 7-9 | history | 📜 |
| 地理 | 7-8 | geography | 🌍 |
| 道德与法治 | 7-9 | politics | ⚖️ |

### 册次结构

```
学科
├── 七年级上册
│   ├── 第一章
│   ├── 第二章
│   └── ...
├── 七年级下册
│   ├── 第一章
│   └── ...
├── 八年级上册
├── 八年级下册
└── 九年级（上下册或全一册）
```

## 知识点分类

### 按内容类型
1. **概念类**: 定义、定理、公式
2. **技能类**: 计算方法、解题技巧
3. **应用类**: 实际问题应用
4. **实验类**: 实验操作、观察记录
5. **记忆类**: 需要记忆的内容

### 按难度等级
1. **基础** (difficulty: 1): 概念理解、基础应用
2. **中等** (difficulty: 2): 综合运用、变形应用
3. **较难** (difficulty: 3): 复杂问题、综合题
4. **难题** (difficulty: 4): 压轴题、竞赛题

## 题目类型规范

### 题型代码
```typescript
type QuestionType = 
  | 'single'     // 单选题
  | 'multiple'   // 多选题
  | 'fill'       // 填空题
  | 'judge'      // 判断题
  | 'essay';     // 解答题
```

### 难度等级
```typescript
type Difficulty = 1 | 2 | 3 | 4 | 5;
// 1: 非常简单
// 2: 简单
// 3: 中等
// 4: 较难
// 5: 非常难
```

### 题目来源
```typescript
type QuestionSource = 
  | 'textbook'    // 教材
  | 'exercise'    // 练习册
  | 'exam'        // 考试真题
  | 'mock'        // 模拟题
  | 'custom';     // 自定义
```

## 文章类型规范

```typescript
type ArticleType = 
  | 'teaching'      // 教学讲解
  | 'overview'      // 知识点概述
  | 'method'        // 学习方法
  | 'analysis'      // 题目分析
  | 'summary'       // 总结归纳
  | 'policy';       // 政策解读
```

## 知识关联类型

```typescript
type KnowledgeRelationType = 
  | 'prerequisite'  // 前驱知识
  | 'successor'     // 后继知识
  | 'related'       // 相关知识
  | 'cross_subject' // 跨学科关联
  | 'extension';    // 扩展内容
```

## 种子数据格式

### 学科数据示例
```typescript
{
  id: 'chinese',
  name: '语文',
  icon: '📖',
  gradeLevel: '7-9',
  description: '初中语文包含阅读理解、写作、文言文等内容',
  chapters: [
    {
      id: 'chinese-7-up',
      name: '七年级上册',
      sections: [
        {
          id: 'chinese-7-up-1',
          name: '第一单元',
          knowledgePoints: [
            {
              id: 'chinese-7-up-1-1',
              name: '春',
              description: '朱自清的散文《春》',
              difficulty: 1,
              content: '文章内容...'
            }
          ]
        }
      ]
    }
  ]
}
```

### 题目数据示例
```typescript
{
  id: 'math-q-001',
  knowledgePointId: 'math-7-up-1-1',
  type: 'single',
  difficulty: 2,
  content: '下列哪个数是正数？',
  answer: 'A',
  explanation: '正数是大于0的数...',
  source: 'textbook',
  options: [
    { id: 'opt-1', label: 'A', content: '+5', isCorrect: true },
    { id: 'opt-2', label: 'B', content: '-3', isCorrect: false },
    { id: 'opt-3', label: 'C', content: '0', isCorrect: false },
    { id: 'opt-4', label: 'D', content: '-10', isCorrect: false },
  ]
}
```

## 数据导入脚本

```typescript
// src/data/seed.ts
import { db } from '@/lib/db/database';
import { subjectsData, questionsData } from './initial-data';

export async function seedDatabase() {
  // 检查是否已初始化
  const count = await db.subjects.count();
  if (count > 0) return;

  // 批量导入
  await db.transaction('rw', [
    db.subjects,
    db.chapters,
    db.knowledgePoints,
    db.questions,
    db.questionOptions,
  ], async () => {
    await db.subjects.bulkAdd(subjectsData.subjects);
    await db.chapters.bulkAdd(subjectsData.chapters);
    await db.knowledgePoints.bulkAdd(subjectsData.knowledgePoints);
    await db.questions.bulkAdd(questionsData.questions);
    await db.questionOptions.bulkAdd(questionsData.options);
  });
}
```
