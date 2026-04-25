"use client"

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  hasFeature,
  getUpgradeMessage,
  type FeatureKey,
  type SubscriptionTier,
} from '@/lib/subscriptions/plans'
import { useSubscriptionTier } from '@/lib/subscriptions/store'
import { Crown, Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { smoothEase } from '@/lib/animations'

interface FeatureGateProps {
  feature: FeatureKey
  children: ReactNode
  fallback?: ReactNode
  showUpgrade?: boolean
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgrade = true,
}: FeatureGateProps) {
  const currentTier = useSubscriptionTier()
  const hasAccess = hasFeature(currentTier, feature)
  const upgradeMessage = getUpgradeMessage(currentTier, feature)

  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (showUpgrade) {
    return (
      <UpgradePrompt
        feature={feature}
        message={upgradeMessage || '此功能需要更高订阅级别'}
      />
    )
  }

  return null
}

interface UpgradePromptProps {
  feature: FeatureKey
  message: string
}

function UpgradePrompt({ feature, message }: UpgradePromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: smoothEase }}
      className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/50 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 mb-4">
        <Lock className="h-6 w-6 text-purple-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">功能受限</h3>
      <p className="text-sm text-gray-600 mb-4 max-w-xs">{message}</p>
      <Link
        href="/subscription"
        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors"
      >
        <Crown className="h-4 w-4" />
        升级到专业版
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  )
}

interface TierGateProps {
  requiredTier: SubscriptionTier
  children: ReactNode
  fallback?: ReactNode
}

export function TierGate({ requiredTier, children, fallback }: TierGateProps) {
  const currentTier = useSubscriptionTier()
  const tierOrder: SubscriptionTier[] = ['FREE', 'PRO', 'ENTERPRISE']
  const currentIndex = tierOrder.indexOf(currentTier)
  const requiredIndex = tierOrder.indexOf(requiredTier)

  if (currentIndex >= requiredIndex) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <UpgradePrompt
      feature="basic_questions"
      message={`此功能需要 ${requiredTier} 级别或更高`}
    />
  )
}

interface LimitGateProps {
  type: 'students' | 'devices' | 'classes'
  currentUsage: number
  limit: number
  children: ReactNode
  fallback?: ReactNode
}

export function LimitGate({
  type,
  currentUsage,
  limit,
  children,
  fallback,
}: LimitGateProps) {
  const isExceeded = currentUsage >= limit && limit !== -1

  if (!isExceeded) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  const limitNames = {
    students: '学生数量',
    devices: '设备数量',
    classes: '班级数量',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/50 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-4">
        <Crown className="h-6 w-6 text-amber-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {limitNames[type]}已达上限
      </h3>
      <p className="text-sm text-gray-600 mb-4 max-w-xs">
        您已使用 {currentUsage} / {limit} 个{limitNames[type]}，升级后可获得更多配额
      </p>
      <Link
        href="/subscription"
        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors"
      >
        升级方案
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  )
}