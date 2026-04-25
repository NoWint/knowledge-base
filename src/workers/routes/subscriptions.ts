import { Hono } from 'hono'
import type { Context } from 'hono'
import type { Env, Subscription, JWTPayload } from '../types'
import { createSuccessResponse, createErrorResponse } from '../types'
import { authMiddleware } from '../middleware/auth'
import { AppError } from '../middleware/error-handler'
import { createSubscriptionKV } from '../kv'

export const subscriptionsRouter = new Hono<{ Bindings: Env }>()

subscriptionsRouter.post('/', authMiddleware, async (c: Context<{ Bindings: Env }>) => {
  try {
    const jwtPayload = c.get('jwtPayload') as JWTPayload
    const { plan } = await c.req.json<{ plan: 'free' | 'pro' | 'enterprise' }>()

    if (!plan || !['free', 'pro', 'enterprise'].includes(plan)) {
      throw new AppError('Invalid plan', 400)
    }

    const subscriptionKV = createSubscriptionKV(c.env)
    const existing = await subscriptionKV.getByUserId(jwtPayload.userId)

    if (existing) {
      return c.json(createErrorResponse('User already has subscription'), 409)
    }

    const now = new Date()
    const expiresAt = new Date()

    if (plan === 'free') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 100)
    } else if (plan === 'pro') {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    }

    const subscription: Subscription = {
      id: crypto.randomUUID(),
      userId: jwtPayload.userId,
      plan,
      status: 'active',
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    }

    await subscriptionKV.put(subscription)

    return c.json(createSuccessResponse(subscription), 201)
  } catch (err) {
    console.error('Create subscription error:', err)
    const message = err instanceof Error ? err.message : 'Failed to create subscription'
    return c.json(createErrorResponse(message), 500)
  }
})

subscriptionsRouter.get('/', authMiddleware, async (c: Context<{ Bindings: Env }>) => {
  try {
    const jwtPayload = c.get('jwtPayload') as JWTPayload
    const subscriptionKV = createSubscriptionKV(c.env)
    const subscription = await subscriptionKV.getByUserId(jwtPayload.userId)

    if (!subscription) {
      return c.json(createErrorResponse('No subscription found'), 404)
    }

    if (subscription.status === 'active' && new Date(subscription.expiresAt) < new Date()) {
      subscription.status = 'expired'
      await subscriptionKV.put(subscription)
    }

    return c.json(createSuccessResponse(subscription))
  } catch (err) {
    console.error('Get subscription error:', err)
    const message = err instanceof Error ? err.message : 'Failed to get subscription'
    return c.json(createErrorResponse(message), 500)
  }
})

subscriptionsRouter.put('/', authMiddleware, async (c: Context<{ Bindings: Env }>) => {
  try {
    const jwtPayload = c.get('jwtPayload') as JWTPayload
    const { plan } = await c.req.json<{ plan: 'free' | 'pro' | 'enterprise' }>()

    if (!plan || !['free', 'pro', 'enterprise'].includes(plan)) {
      throw new AppError('Invalid plan', 400)
    }

    const subscriptionKV = createSubscriptionKV(c.env)
    const existing = await subscriptionKV.getByUserId(jwtPayload.userId)

    if (!existing) {
      return c.json(createErrorResponse('No subscription found'), 404)
    }

    const expiresAt = new Date()
    if (plan === 'free') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 100)
    } else if (plan === 'pro') {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    }

    const updated: Subscription = {
      ...existing,
      plan,
      expiresAt: expiresAt.toISOString(),
    }

    await subscriptionKV.put(updated)

    return c.json(createSuccessResponse(updated))
  } catch (err) {
    console.error('Update subscription error:', err)
    const message = err instanceof Error ? err.message : 'Failed to update subscription'
    return c.json(createErrorResponse(message), 500)
  }
})

subscriptionsRouter.delete('/', authMiddleware, async (c: Context<{ Bindings: Env }>) => {
  try {
    const jwtPayload = c.get('jwtPayload') as JWTPayload
    const subscriptionKV = createSubscriptionKV(c.env)

    await subscriptionKV.deleteByUserId(jwtPayload.userId)

    return c.json(createSuccessResponse({ cancelled: true }))
  } catch (err) {
    console.error('Cancel subscription error:', err)
    const message = err instanceof Error ? err.message : 'Failed to cancel subscription'
    return c.json(createErrorResponse(message), 500)
  }
})