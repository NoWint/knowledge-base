# 窗口 4: 闪卡生态系统

## 任务概述
完善闪卡系统，实现知识点/错题与闪卡的联动，以及闪卡复习的 SM-2 集成。

## 完整任务列表

### Task 4.1: 知识点详情页添加闪卡入口

**文件**: `src/app/knowledge/resources/page.tsx`

在知识点详情页添加「创建闪卡」按钮：

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

UI 位置：在「相关练习」区域下方添加按钮。

### Task 4.2: 错题详情添加闪卡入口

**文件**: `src/app/wrong/page.tsx`

在错题展开区域添加「创建闪卡」按钮：

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

### Task 4.3: 闪卡复习集成 SM-2

**文件**: `src/app/cards/review/page.tsx`

修改闪卡复习流程，使用 SM-2 算法：

```typescript
import { calculateSM2 } from '@/lib/algorithms/sm2'

// 闪卡复习后的 SM-2 更新
async function reviewFlashCard(isCorrect: boolean) {
  const review = currentReview // UserFlashCardReview

  const quality = isCorrect ? 4 : 1  // 简单映射

  const result = calculateSM2({
    quality,
    easeFactor: review.easeFactor,
    interval: review.interval,
    repetitions: review.repetitions,
  })

  await db.userFlashCardReviews.update(review.id, {
    easeFactor: result.easeFactor,
    interval: result.interval,
    repetitions: result.repetitions,
    nextReviewDate: result.nextReviewDate,
    lastReviewDate: new Date(),
  })
}
```

### Task 4.4: 创建闪卡时初始化 Review

在创建闪卡时，同时创建对应的 `UserFlashCardReview` 记录：

```typescript
async function createCard(front: string, back: string, knowledgePointId: string) {
  const cardId = crypto.randomUUID()

  await db.flashCards.add({
    id: cardId,
    knowledgePointId,
    front,
    back,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // 同时创建复习记录
  await db.userFlashCardReviews.add({
    id: crypto.randomUUID(),
    userId: currentUser.id,
    flashCardId: cardId,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date(),
    lastReviewDate: null,
  })
}
```

### Task 4.5: 加载待复习闪卡

修改 `cards/review/page.tsx`，只加载 `nextReviewDate <= now` 的闪卡：

```typescript
async function loadDueCards() {
  const now = new Date()
  const reviews = await db.userFlashCardReviews
    .where('userId').equals(currentUser.id)
    .filter(r => r.nextReviewDate <= now)
    .toArray()

  // 加载对应的闪卡
  const cards = await Promise.all(
    reviews.map(r => db.flashCards.get(r.flashCardId))
  )
  // ...
}
```

### Task 4.6: 闪卡列表页增强

**文件**: `src/app/cards/page.tsx`

- 显示每个闪卡的下次复习时间
- 显示复习次数
- 添加「创建闪卡」表单（目前是空的）

## 验收标准
1. 知识点详情页可以创建闪卡
2. 错题详情可以创建闪卡
3. 闪卡复习使用 SM-2 算法
4. 创建闪卡时自动创建复习记录
5. TypeScript 编译无错误

## 参考文件
- `src/lib/algorithms/sm2.ts`
- `src/types/database.ts`
- `src/components/cards/flash-card.tsx`
