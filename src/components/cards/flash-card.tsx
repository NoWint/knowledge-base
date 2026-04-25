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