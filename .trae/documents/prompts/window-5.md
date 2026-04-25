# 对话 5: 闪卡系统

**提示词**:

```
请执行以下任务：

## 任务 C.1: 创建闪卡列表页面

新建文件: `src/app/cards/page.tsx`

参考 `src/app/practice/page.tsx` 的风格，创建闪卡管理页面：

```tsx
"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { db } from "@/lib/db/database"
import { useUserStore } from "@/store/user-store"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Cards, Edit2, Trash2, BookOpen, ChevronRight } from "lucide-react"
import { smoothEase } from "@/lib/animations"
import Link from "next/link"
import type { FlashCard, KnowledgePoint } from "@/types"

export default function CardsPage() {
  const { currentUser } = useUserStore()
  const [cards, setCards] = useState<(FlashCard & { knowledgePoint?: KnowledgePoint })[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadCards()
  }, [currentUser])

  async function loadCards() {
    if (!currentUser) return
    setLoading(true)
    try {
      const allCards = await db.flashCards.toArray()
      const kps = await db.knowledgePoints.toArray()
      const kpMap = new Map(kps.map(kp => [kp.id, kp]))

      const enrichedCards = allCards.map(card => ({
        ...card,
        knowledgePoint: kpMap.get(card.knowledgePointId),
      }))

      setCards(enrichedCards)
    } catch (err) {
      console.error('Failed to load cards:', err)
    } finally {
      setLoading(false)
    }
  }

  async function deleteCard(id: string) {
    await db.flashCards.delete(id)
    await db.userFlashCardReviews.where('flashCardId').equals(id).delete()
    loadCards()
  }

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: smoothEase }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500 text-white">
              <Cards className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">学习闪卡</h1>
              <p className="text-sm text-gray-500">共 {cards.length} 张卡片</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/cards/review"
              className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 flex items-center gap-1.5"
            >
              开始复习
            </Link>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> 创建
            </button>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-12">
            <Cards className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 mb-4">还没有创建闪卡</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium"
            >
              创建第一张闪卡
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence>
              {cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-xl border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        Q: {card.front}
                      </div>
                      <div className="text-sm text-gray-500">
                        A: {card.back}
                      </div>
                      {card.knowledgePoint && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-purple-600">
                          <BookOpen className="h-3 w-3" />
                          {card.knowledgePoint.name}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => deleteCard(card.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </AppLayout>
  )
}
```

完成后，确保 TypeScript 编译无错误。
```

---

```
## 任务 C.2: 创建翻转闪卡组件

新建文件: `src/components/cards/flash-card.tsx`

```tsx
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface FlashCardProps {
  front: string
  back: string
  onFlip?: (isCorrect: boolean) => void
}

export function FlashCard({ front, back, onFlip }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleAnswer = (isCorrect: boolean) => {
    onFlip?.(isCorrect)
    setIsFlipped(false)
  }

  return (
    <div className="perspective-1000 w-full max-w-md mx-auto">
      <motion.div
        className="relative w-full h-64 cursor-pointer"
        onClick={handleFlip}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <AnimatePresence mode="wait">
          {!isFlipped ? (
            <motion.div
              key="front"
              initial={{ rotateY: -180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 180, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-6 flex flex-col items-center justify-center text-white shadow-xl"
            >
              <div className="text-xs uppercase tracking-wider mb-2 opacity-75">问题</div>
              <div className="text-lg font-medium text-center">{front}</div>
              <div className="absolute bottom-4 text-xs opacity-50">点击翻转</div>
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ rotateY: 180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -180, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 flex flex-col items-center justify-center text-white shadow-xl"
            >
              <div className="text-xs uppercase tracking-wider mb-2 opacity-75">答案</div>
              <div className="text-lg font-medium text-center">{back}</div>
              <div className="absolute bottom-4 text-xs opacity-50">点击返回</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
```

完成后，确保 TypeScript 编译无错误。
```

---

```
## 任务 C.3: 创建闪卡复习页面

新建文件: `src/app/cards/review/page.tsx`

```tsx
"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { db } from "@/lib/db/database"
import { useUserStore } from "@/store/user-store"
import { motion } from "framer-motion"
import { FlashCard } from "@/components/cards/flash-card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, RotateCcw, Home } from "lucide-react"
import Link from "next/link"
import { smoothEase } from "@/lib/animations"
import type { FlashCard as FlashCardType } from "@/types"

export default function CardsReviewPage() {
  const { currentUser } = useUserStore()
  const [cards, setCards] = useState<FlashCardType[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCards()
  }, [currentUser])

  async function loadCards() {
    if (!currentUser) return
    setLoading(true)
    try {
      const allCards = await db.flashCards.toArray()
      const shuffled = allCards.sort(() => Math.random() - 0.5)
      setCards(shuffled)
      setResults([])
      setCurrentIndex(0)
    } catch (err) {
      console.error('Failed to load cards:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFlip = (isCorrect: boolean) => {
    setResults(prev => [...prev, isCorrect])
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1)
      }
    }, 500)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center text-gray-500">加载中...</div>
        </div>
      </AppLayout>
    )
  }

  if (cards.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[400px]">
          <p className="text-gray-600 mb-4">还没有闪卡可复习</p>
          <Link href="/cards" className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm">
            去创建闪卡
          </Link>
        </div>
      </AppLayout>
    )
  }

  if (currentIndex >= cards.length) {
    const correct = results.filter(r => r).length
    const accuracy = Math.round((correct / results.length) * 100)

    return (
      <AppLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto text-center py-12"
        >
          <div className="text-6xl mb-4">{accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪'}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">复习完成！</h2>
          <p className="text-gray-600 mb-6">
            正确率 {accuracy}% ({correct}/{results.length})
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => { setCurrentIndex(0); setResults([]); loadCards(); }}
              className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium flex items-center gap-1.5"
            >
              <RotateCcw className="h-4 w-4" /> 再学一遍
            </button>
            <Link
              href="/cards"
              className="px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-1.5"
            >
              <Home className="h-4 w-4" /> 返回
            </Link>
          </div>
        </motion.div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>进度 {currentIndex + 1}/{cards.length}</span>
            <span>{results.length > 0 ? Math.round((results.filter(r => r).length / results.length) * 100) : 0}% 正确</span>
          </div>
          <Progress value={((currentIndex + 1) / cards.length) * 100} className="h-2" />
        </div>

        <FlashCard
          key={cards[currentIndex].id}
          front={cards[currentIndex].front}
          back={cards[currentIndex].back}
          onFlip={handleFlip}
        />
      </div>
    </AppLayout>
  )
}
```

完成后，确保 TypeScript 编译无错误。
```

注意：确保 `src/components/ui/progress.tsx` 存在，如果不存在需要创建。
