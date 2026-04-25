import type { Subscription } from '../types'
import type { Env } from '../types'

export const PLAN_FEATURES = {
  free: {
    name: '免费版',
    price: 0,
    deviceLimit: 2,
    studentLimit: 1,
    features: [
      '基础题库',
      'SM-2间隔复习算法',
      '跨设备同步(限2设备)',
      '基础学习统计',
    ],
  },
  pro: {
    name: '专业版',
    price: 99,
    period: '月/学校',
    deviceLimit: 5,
    studentLimit: 50,
    features: [
      '免费版全部功能',
      '扩展题库',
      '班级管理(最多50学生)',
      '作业布置功能',
      '基础学情分析',
      '优先客服支持',
    ],
  },
  enterprise: {
    name: '旗舰版',
    price: 299,
    period: '月/学校',
    deviceLimit: -1,
    studentLimit: -1,
    features: [
      '专业版全部功能',
      '无限班级',
      'AI智能出题',
      '高级数据分析',
      '学情报告生成',
      'API接入',
      '专属客服',
      '私有部署选项',
    ],
  },
} as const

export type PlanType = keyof typeof PLAN_FEATURES

export function getSubscriptionKey(subscriptionId: string): string {
  return `subscription:${subscriptionId}`
}

export function getUserSubscriptionKey(userId: string): string {
  return `userSubscription:${userId}`
}

export async function createSubscription(
  env: Env,
  userId: string,
  plan: PlanType
): Promise<Subscription> {
  const planConfig = PLAN_FEATURES[plan]
  const now = Date.now()

  const subscription: Subscription = {
    id: crypto.randomUUID(),
    userId,
    plan,
    status: 'active',
    startDate: now,
    endDate: plan === 'free' ? -1 : now + 30 * 24 * 60 * 60 * 1000,
    deviceLimit: planConfig.deviceLimit,
    studentLimit: planConfig.studentLimit,
    price: planConfig.price,
    autoRenew: plan !== 'free',
  }

  await env.SUBSCRIPTIONS_KV.put(getSubscriptionKey(subscription.id), JSON.stringify(subscription))
  await env.SUBSCRIPTIONS_KV.put(getUserSubscriptionKey(userId), subscription.id)

  const userKey = `user:${userId}`
  const userData = await env.USERS_KV.get(userKey)
  if (userData) {
    const user = JSON.parse(userData)
    user.subscriptionId = subscription.id
    user.subscriptionPlan = plan
    await env.USERS_KV.put(userKey, JSON.stringify(user))
  }

  return subscription
}

export async function getSubscription(
  env: Env,
  subscriptionId: string
): Promise<Subscription | null> {
  const data = await env.SUBSCRIPTIONS_KV.get(getSubscriptionKey(subscriptionId))
  if (!data) return null
  return JSON.parse(data) as Subscription
}

export async function getUserSubscription(
  env: Env,
  userId: string
): Promise<Subscription | null> {
  const subscriptionId = await env.SUBSCRIPTIONS_KV.get(getUserSubscriptionKey(userId))
  if (!subscriptionId) return null
  return getSubscription(env, subscriptionId)
}

export async function cancelSubscription(
  env: Env,
  subscriptionId: string
): Promise<Subscription | null> {
  const subscription = await getSubscription(env, subscriptionId)
  if (!subscription) return null

  subscription.status = 'cancelled'
  subscription.autoRenew = false

  await env.SUBSCRIPTIONS_KV.put(getSubscriptionKey(subscriptionId), JSON.stringify(subscription))

  return subscription
}

export async function renewSubscription(
  env: Env,
  subscriptionId: string
): Promise<Subscription | null> {
  const subscription = await getSubscription(env, subscriptionId)
  if (!subscription || subscription.plan === 'free') return null

  subscription.endDate = Date.now() + 30 * 24 * 60 * 60 * 1000
  subscription.status = 'active'
  subscription.autoRenew = true

  await env.SUBSCRIPTIONS_KV.put(getSubscriptionKey(subscriptionId), JSON.stringify(subscription))

  return subscription
}

export function checkFeatureAccess(
  subscription: Subscription | null,
  feature: string
): boolean {
  if (!subscription || subscription.status !== 'active') {
    return (PLAN_FEATURES.free.features as readonly string[]).includes(feature)
  }

  const planFeatures = PLAN_FEATURES[subscription.plan].features as readonly string[]
  return planFeatures.includes(feature)
}

export function checkDeviceLimit(
  subscription: Subscription | null,
  currentDeviceCount: number
): boolean {
  if (!subscription || subscription.status !== 'active') {
    return currentDeviceCount < PLAN_FEATURES.free.deviceLimit
  }

  const limit = PLAN_FEATURES[subscription.plan].deviceLimit
  return limit === -1 || currentDeviceCount < limit
}
