export type SubscriptionTier = 'FREE' | 'PRO' | 'ENTERPRISE'

export type FeatureKey =
  | 'basic_questions'
  | 'sm2_review'
  | 'cross_device_sync'
  | 'extended_questions'
  | 'class_management'
  | 'basic_analytics'
  | 'ai_question_generation'
  | 'unlimited_classes'
  | 'advanced_analytics'
  | 'api_access'
  | 'priority_support'
  | 'custom_branding'

export interface PlanFeature {
  key: FeatureKey
  name: string
  description: string
  tier: SubscriptionTier
}

export interface SubscriptionPlan {
  id: SubscriptionTier
  name: string
  price: number
  priceUnit: string
  description: string
  features: FeatureKey[]
  limits: {
    students?: number
    devices?: number
    questions?: number
    classes?: number
  }
  recommended?: boolean
}

export interface Subscription {
  id: string
  userId: string
  planId: SubscriptionTier
  status: 'active' | 'cancelled' | 'expired' | 'trial'
  startedAt: Date
  expiresAt: Date | null
  cancelledAt: Date | null
  currentPeriodStart: Date
  currentPeriodEnd: Date
  trialEndsAt?: Date
}

export interface UsageStats {
  studentCount: number
  deviceCount: number
  totalQuestions: number
  classesCount: number
}

export const FEATURES: Record<FeatureKey, PlanFeature> = {
  basic_questions: {
    key: 'basic_questions',
    name: '基础题库',
    description: '访问人教版教材基础题目',
    tier: 'FREE',
  },
  sm2_review: {
    key: 'sm2_review',
    name: 'SM-2 复习算法',
    description: '基于间隔重复的智能复习系统',
    tier: 'FREE',
  },
  cross_device_sync: {
    key: 'cross_device_sync',
    name: '跨设备同步',
    description: '支持多设备学习数据同步',
    tier: 'FREE',
  },
  extended_questions: {
    key: 'extended_questions',
    name: '扩展题库',
    description: '中考真题、模拟卷、压轴题',
    tier: 'PRO',
  },
  class_management: {
    key: 'class_management',
    name: '班级管理',
    description: '创建和管理学习班级',
    tier: 'PRO',
  },
  basic_analytics: {
    key: 'basic_analytics',
    name: '基础统计',
    description: '学习进度、正确率等基础数据',
    tier: 'PRO',
  },
  ai_question_generation: {
    key: 'ai_question_generation',
    name: 'AI 题目生成',
    description: '基于 AI 的智能出题功能',
    tier: 'ENTERPRISE',
  },
  unlimited_classes: {
    key: 'unlimited_classes',
    name: '无限班级',
    description: '创建和管理不限数量的班级',
    tier: 'ENTERPRISE',
  },
  advanced_analytics: {
    key: 'advanced_analytics',
    name: '高级分析',
    description: '知识点掌握度、错题分析等深度数据',
    tier: 'ENTERPRISE',
  },
  api_access: {
    key: 'api_access',
    name: 'API 接口',
    description: '开放 API 接口支持第三方集成',
    tier: 'ENTERPRISE',
  },
  priority_support: {
    key: 'priority_support',
    name: '优先客服',
    description: '7×24 小时优先技术支持',
    tier: 'ENTERPRISE',
  },
  custom_branding: {
    key: 'custom_branding',
    name: '定制品牌',
    description: '自定义界面 Logo 和主题色',
    tier: 'ENTERPRISE',
  },
}

export const PLANS: SubscriptionPlan[] = [
  {
    id: 'FREE',
    name: '免费版',
    price: 0,
    priceUnit: '永久',
    description: '适合个人学习者入门使用',
    features: ['basic_questions', 'sm2_review', 'cross_device_sync'],
    limits: {
      students: 1,
      devices: 2,
      questions: 1000,
      classes: 0,
    },
  },
  {
    id: 'PRO',
    name: '专业版',
    price: 99,
    priceUnit: '学校/月',
    description: '适合教师和小型培训机构',
    features: [
      'basic_questions',
      'sm2_review',
      'cross_device_sync',
      'extended_questions',
      'class_management',
      'basic_analytics',
    ],
    limits: {
      students: 50,
      devices: 10,
      questions: 50000,
      classes: 5,
    },
    recommended: true,
  },
  {
    id: 'ENTERPRISE',
    name: '旗舰版',
    price: 299,
    priceUnit: '学校/月',
    description: '适合学校和大型教育机构',
    features: [
      'basic_questions',
      'sm2_review',
      'cross_device_sync',
      'extended_questions',
      'class_management',
      'basic_analytics',
      'ai_question_generation',
      'unlimited_classes',
      'advanced_analytics',
      'api_access',
      'priority_support',
      'custom_branding',
    ],
    limits: {
      students: -1,
      devices: -1,
      questions: -1,
      classes: -1,
    },
  },
]

export function hasFeature(planId: SubscriptionTier, feature: FeatureKey): boolean {
  const plan = PLANS.find(p => p.id === planId)
  if (!plan) return false
  return plan.features.includes(feature)
}

export function getPlan(planId: SubscriptionTier): SubscriptionPlan | undefined {
  return PLANS.find(p => p.id === planId)
}

export function getFeatureLimit(
  planId: SubscriptionTier,
  limitType: 'students' | 'devices' | 'questions' | 'classes'
): number {
  const plan = getPlan(planId)
  if (!plan) return 0
  return plan.limits[limitType] ?? 0
}

export function isLimitExceeded(
  planId: SubscriptionTier,
  limitType: 'students' | 'devices' | 'questions' | 'classes',
  currentUsage: number
): boolean {
  const limit = getFeatureLimit(planId, limitType)
  if (limit === -1) return false
  return currentUsage >= limit
}

export function getUpgradeMessage(
  currentPlan: SubscriptionTier,
  requiredFeature: FeatureKey
): string | null {
  const requiredPlan = FEATURES[requiredFeature]?.tier
  if (!requiredPlan) return null

  const planOrder: SubscriptionTier[] = ['FREE', 'PRO', 'ENTERPRISE']
  const currentIndex = planOrder.indexOf(currentPlan)
  const requiredIndex = planOrder.indexOf(requiredPlan)

  if (requiredIndex > currentIndex) {
    const plan = PLANS.find(p => p.id === requiredPlan)
    return `此功能需要 ${plan?.name}，当前为 ${getPlan(currentPlan)?.name}`
  }

  return null
}