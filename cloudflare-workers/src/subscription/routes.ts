import { Hono } from 'hono'
import type { Env, APIResponse } from '../types'
import { verifyToken } from '../auth/service'
import {
  PLAN_FEATURES,
  getUserSubscription,
  createSubscription,
  cancelSubscription,
  renewSubscription,
  checkFeatureAccess,
  checkDeviceLimit,
  type PlanType,
} from './service'

export const subscriptionRouter = new Hono<{ Bindings: Env }>()

subscriptionRouter.get('/plans', async (c) => {
  const response: APIResponse<typeof PLAN_FEATURES> = {
    success: true,
    data: PLAN_FEATURES,
    timestamp: Date.now(),
  }
  return c.json(response)
})

subscriptionRouter.post('/create', async (c) => {
  try {
    const user = verifyToken(
      c.req.header('Authorization')?.replace('Bearer ', '') || '',
      c.env.JWT_SECRET
    )
    if (!user) {
      const response: APIResponse = { success: false, error: 'Unauthorized', timestamp: Date.now() }
      return c.json(response, 401)
    }

    const body = await c.req.json()
    const { plan } = body as { plan: PlanType }

    if (!plan || !PLAN_FEATURES[plan]) {
      const response: APIResponse = {
        success: false,
        error: 'Validation Error',
        message: 'Invalid plan type',
        timestamp: Date.now(),
      }
      return c.json(response, 400)
    }

    const subscription = await createSubscription(c.env, user.userId, plan)

    const response: APIResponse<{ subscription: typeof subscription }> = {
      success: true,
      data: { subscription },
      timestamp: Date.now(),
    }
    return c.json(response)
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: 'Subscription Error',
      message: error instanceof Error ? error.message : 'Failed to create subscription',
      timestamp: Date.now(),
    }
    return c.json(response, 500)
  }
})

subscriptionRouter.get('/status', async (c) => {
  try {
    const user = verifyToken(
      c.req.header('Authorization')?.replace('Bearer ', '') || '',
      c.env.JWT_SECRET
    )
    if (!user) {
      const response: APIResponse = { success: false, error: 'Unauthorized', timestamp: Date.now() }
      return c.json(response, 401)
    }

    const subscription = await getUserSubscription(c.env, user.userId)
    const planFeatures = subscription ? PLAN_FEATURES[subscription.plan] : PLAN_FEATURES.free

    const response: APIResponse<{
      subscription: typeof subscription
      planFeatures: typeof planFeatures
    }> = {
      success: true,
      data: {
        subscription,
        planFeatures,
      },
      timestamp: Date.now(),
    }
    return c.json(response)
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: 'Subscription Error',
      message: error instanceof Error ? error.message : 'Failed to get subscription status',
      timestamp: Date.now(),
    }
    return c.json(response, 500)
  }
})

subscriptionRouter.post('/cancel', async (c) => {
  try {
    const user = verifyToken(
      c.req.header('Authorization')?.replace('Bearer ', '') || '',
      c.env.JWT_SECRET
    )
    if (!user) {
      const response: APIResponse = { success: false, error: 'Unauthorized', timestamp: Date.now() }
      return c.json(response, 401)
    }

    const subscription = await getUserSubscription(c.env, user.userId)
    if (!subscription) {
      const response: APIResponse = {
        success: false,
        error: 'Not Found',
        message: 'No active subscription found',
        timestamp: Date.now(),
      }
      return c.json(response, 404)
    }

    const cancelled = await cancelSubscription(c.env, subscription.id)

    const response: APIResponse<{ subscription: typeof cancelled }> = {
      success: true,
      data: { subscription: cancelled },
      timestamp: Date.now(),
    }
    return c.json(response)
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: 'Subscription Error',
      message: error instanceof Error ? error.message : 'Failed to cancel subscription',
      timestamp: Date.now(),
    }
    return c.json(response, 500)
  }
})

subscriptionRouter.post('/renew', async (c) => {
  try {
    const user = verifyToken(
      c.req.header('Authorization')?.replace('Bearer ', '') || '',
      c.env.JWT_SECRET
    )
    if (!user) {
      const response: APIResponse = { success: false, error: 'Unauthorized', timestamp: Date.now() }
      return c.json(response, 401)
    }

    const subscription = await getUserSubscription(c.env, user.userId)
    if (!subscription) {
      const response: APIResponse = {
        success: false,
        error: 'Not Found',
        message: 'No subscription found to renew',
        timestamp: Date.now(),
      }
      return c.json(response, 404)
    }

    const renewed = await renewSubscription(c.env, subscription.id)

    const response: APIResponse<{ subscription: typeof renewed }> = {
      success: true,
      data: { subscription: renewed },
      timestamp: Date.now(),
    }
    return c.json(response)
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: 'Subscription Error',
      message: error instanceof Error ? error.message : 'Failed to renew subscription',
      timestamp: Date.now(),
    }
    return c.json(response, 500)
  }
})

subscriptionRouter.get('/features/:feature', async (c) => {
  try {
    const user = verifyToken(
      c.req.header('Authorization')?.replace('Bearer ', '') || '',
      c.env.JWT_SECRET
    )
    if (!user) {
      const response: APIResponse = { success: false, error: 'Unauthorized', timestamp: Date.now() }
      return c.json(response, 401)
    }

    const feature = c.req.param('feature')
    const subscription = await getUserSubscription(c.env, user.userId)
    const hasAccess = checkFeatureAccess(subscription, feature)

    const response: APIResponse<{ hasAccess: boolean }> = {
      success: true,
      data: { hasAccess },
      timestamp: Date.now(),
    }
    return c.json(response)
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: 'Subscription Error',
      message: error instanceof Error ? error.message : 'Failed to check feature access',
      timestamp: Date.now(),
    }
    return c.json(response, 500)
  }
})

subscriptionRouter.get('/device-check', async (c) => {
  try {
    const user = verifyToken(
      c.req.header('Authorization')?.replace('Bearer ', '') || '',
      c.env.JWT_SECRET
    )
    if (!user) {
      const response: APIResponse = { success: false, error: 'Unauthorized', timestamp: Date.now() }
      return c.json(response, 401)
    }

    const subscription = await getUserSubscription(c.env, user.userId)
    const canAdd = checkDeviceLimit(subscription, user.userId.length)

    const response: APIResponse<{ canAddDevice: boolean; currentCount: number; limit: number }> = {
      success: true,
      data: {
        canAddDevice: canAdd,
        currentCount: 0,
        limit: subscription ? PLAN_FEATURES[subscription.plan].deviceLimit : PLAN_FEATURES.free.deviceLimit,
      },
      timestamp: Date.now(),
    }
    return c.json(response)
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: 'Subscription Error',
      message: error instanceof Error ? error.message : 'Failed to check device limit',
      timestamp: Date.now(),
    }
    return c.json(response, 500)
  }
})
