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
import { calculateSM2 } from "@/lib/algorithms/sm2"
import type { FlashCard as FlashCardType, UserFlashCardReview } from "@/types"

interface CardWithReview extends FlashCardType {
  review: UserFlashCardReview
}

export default function CardsReviewPage() {
  const { currentUser } = useUserStore()
  const [cards, setCards] = useState<CardWithReview[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDueCards()
  }, [currentUser])

  async function loadDueCards() {
    if (!currentUser) return
    setLoading(true)
    try {
      const now = new Date()
      const reviews = await db.userFlashCardReviews
        .where("userId")
        .equals(currentUser.id)
        .filter(r => new Date(r.nextReviewDate) <= now)
        .toArray()

      const cardsWithReviews: CardWithReview[] = []
      for (const review of reviews) {
        const card = await db.flashCards.get(review.flashCardId)
        if (card) {
          cardsWithReviews.push({ ...card, review })
        }
      }

      const shuffled = cardsWithReviews.sort(() => Math.random() - 0.5)
      setCards(shuffled)
      setResults([])
      setCurrentIndex(0)
    } catch (err) {
      console.error("Failed to load cards:", err)
    } finally {
      setLoading(false)
    }
  }

  async function reviewCard(cardId: string, isCorrect: boolean) {
    const card = cards.find(c => c.id === cardId)
    if (!card) return

    const quality = isCorrect ? 4 : 1

    const result = calculateSM2({
      quality,
      easeFactor: card.review.easeFactor,
      interval: card.review.interval,
      repetitions: card.review.repetitions,
    })

    await db.userFlashCardReviews.update(card.review.id, {
      easeFactor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      nextReviewDate: result.nextReviewDate,
      lastReviewDate: new Date(),
    })
  }

  const handleFlip = (isCorrect: boolean) => {
    const currentCard = cards[currentIndex]
    if (currentCard) {
      reviewCard(currentCard.id, isCorrect)
    }
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
          <CheckCircle className="h-12 w-12 text-green-400 mb-4" />
          <p className="text-gray-600 mb-2">暂无待复习的闪卡</p>
          <p className="text-gray-400 text-sm mb-4">创建新闪卡开始学习吧</p>
          <Link href="/cards" className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm">
            去创建闪卡
          </Link>
        </div>
      </AppLayout>
    )
  }

  if (currentIndex >= cards.length) {
    const correct = results.filter(r => r).length
    const accuracy = results.length > 0 ? Math.round((correct / results.length) * 100) : 0

    return (
      <AppLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto text-center py-12"
        >
          <div className="text-6xl mb-4">{accuracy >= 80 ? "🎉" : accuracy >= 60 ? "👍" : "💪"}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">复习完成！</h2>
          <p className="text-gray-600 mb-6">
            正确率 {accuracy}% ({correct}/{results.length})
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setCurrentIndex(0)
                setResults([])
                loadDueCards()
              }}
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

  const currentCard = cards[currentIndex]

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              进度 {currentIndex + 1}/{cards.length}
            </span>
            <span>
              {results.length > 0
                ? Math.round((results.filter(r => r).length / results.length) * 100)
                : 0}
              % 正确
            </span>
          </div>
          <Progress value={((currentIndex + 1) / cards.length) * 100} className="h-2" />
        </div>

        <FlashCard
          key={currentCard.id}
          front={currentCard.front}
          back={currentCard.back}
          onFlip={handleFlip}
        />

        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleFlip(false)}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
          >
            <XCircle className="h-5 w-5" />
            没想起来
          </button>
          <button
            onClick={() => handleFlip(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
          >
            <CheckCircle className="h-5 w-5" />
            想起来了
          </button>
        </div>

        <div className="text-center text-xs text-gray-400">
          下次复习: {new Date(currentCard.review.nextReviewDate).toLocaleDateString()}
        </div>
      </div>
    </AppLayout>
  )
}