"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { db } from "@/lib/db/database"
import { useUserStore } from "@/store/user-store"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Edit2, Trash2, BookOpen, ChevronRight, Bookmark, X, Clock, RefreshCw } from "lucide-react"
import { smoothEase } from "@/lib/animations"
import Link from "next/link"
import type { FlashCard, KnowledgePoint, UserFlashCardReview } from "@/types"
import { getAllKnowledgePoints } from "@/lib/data-access/subject-data"

interface CardWithMeta extends FlashCard {
  knowledgePoint?: KnowledgePoint
  review?: UserFlashCardReview
}

export default function CardsPage() {
  const { currentUser } = useUserStore()
  const [cards, setCards] = useState<CardWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newCard, setNewCard] = useState({ front: "", back: "", knowledgePointId: "" })
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([])

  useEffect(() => {
    loadCards()
    loadKnowledgePoints()
  }, [currentUser])

  async function loadKnowledgePoints() {
    const kps = await getAllKnowledgePoints()
    setKnowledgePoints(kps)
  }

  async function loadCards() {
    if (!currentUser) return
    setLoading(true)
    try {
      const allCards = await db.flashCards.toArray()
      const allReviews = await db.userFlashCardReviews
        .where("userId")
        .equals(currentUser.id)
        .toArray()
      const kps = await getAllKnowledgePoints()
      const kpMap = new Map(kps.map(kp => [kp.id, kp]))
      const reviewMap = new Map(allReviews.map(r => [r.flashCardId, r]))

      const enrichedCards = allCards.map(card => ({
        ...card,
        knowledgePoint: kpMap.get(card.knowledgePointId),
        review: reviewMap.get(card.id),
      }))

      setCards(enrichedCards)
    } catch (err) {
      console.error("Failed to load cards:", err)
    } finally {
      setLoading(false)
    }
  }

  async function createCard() {
    if (!currentUser || !newCard.front.trim() || !newCard.back.trim()) return

    const cardId = crypto.randomUUID()

    await db.flashCards.add({
      id: cardId,
      knowledgePointId: newCard.knowledgePointId || "",
      front: newCard.front.trim(),
      back: newCard.back.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

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

    setNewCard({ front: "", back: "", knowledgePointId: "" })
    setShowForm(false)
    loadCards()
  }

  async function deleteCard(id: string) {
    await db.flashCards.delete(id)
    await db.userFlashCardReviews.where("flashCardId").equals(id).delete()
    loadCards()
  }

  function formatNextReview(review: UserFlashCardReview | undefined): string {
    if (!review) return "未开始复习"
    const next = new Date(review.nextReviewDate)
    const now = new Date()
    if (next <= now) return "待复习"
    const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) return "明天"
    if (diffDays <= 7) return `${diffDays}天后`
    return next.toLocaleDateString()
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
              <Bookmark className="h-5 w-5" />
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

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">创建新闪卡</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    问题 (正面)
                  </label>
                  <textarea
                    value={newCard.front}
                    onChange={e => setNewCard({ ...newCard, front: e.target.value })}
                    placeholder="输入问题或概念..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    答案 (背面)
                  </label>
                  <textarea
                    value={newCard.back}
                    onChange={e => setNewCard({ ...newCard, back: e.target.value })}
                    placeholder="输入答案或解释..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    关联知识点 (可选)
                  </label>
                  <select
                    value={newCard.knowledgePointId}
                    onChange={e => setNewCard({ ...newCard, knowledgePointId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">无关联</option>
                    {knowledgePoints.map(kp => (
                      <option key={kp.id} value={kp.id}>
                        {kp.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={createCard}
                    disabled={!newCard.front.trim() || !newCard.back.trim()}
                    className="flex-1 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    创建闪卡
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {cards.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="h-12 w-12 mx-auto text-gray-300 mb-3" />
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
                      <div className="text-sm text-gray-500">A: {card.back}</div>
                      <div className="flex items-center gap-4 mt-2">
                        {card.knowledgePoint && (
                          <div className="flex items-center gap-1 text-xs text-purple-600">
                            <BookOpen className="h-3 w-3" />
                            {card.knowledgePoint.name}
                          </div>
                        )}
                        {card.review && (
                          <>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <RefreshCw className="h-3 w-3" />
                              {card.review.repetitions} 次复习
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {formatNextReview(card.review)}
                            </div>
                          </>
                        )}
                      </div>
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