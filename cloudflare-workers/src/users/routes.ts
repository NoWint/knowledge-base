import { Hono } from 'hono'
import type { Env, APIResponse } from '../types'
import { verifyToken, getUserById } from '../auth/service'

export const usersRouter = new Hono<{ Bindings: Env }>()

usersRouter.get('/profile', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    if (!token) {
      const response: APIResponse = { success: false, error: 'Unauthorized', timestamp: Date.now() }
      return c.json(response, 401)
    }

    const payload = verifyToken(token, c.env.JWT_SECRET)
    if (!payload) {
      const response: APIResponse = { success: false, error: 'Unauthorized', timestamp: Date.now() }
      return c.json(response, 401)
    }

    const user = await getUserById(c.env, payload.userId)
    if (!user) {
      const response: APIResponse = { success: false, error: 'Not Found', timestamp: Date.now() }
      return c.json(response, 404)
    }

    const { passwordHash: _, ...safeUser } = user

    const response: APIResponse<{ user: Omit<typeof user, 'passwordHash'> }> = {
      success: true,
      data: { user: safeUser as Omit<typeof user, 'passwordHash'> },
      timestamp: Date.now(),
    }
    return c.json(response)
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: 'User Error',
      message: error instanceof Error ? error.message : 'Failed to get profile',
      timestamp: Date.now(),
    }
    return c.json(response, 500)
  }
})

usersRouter.put('/profile', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    if (!token) {
      const response: APIResponse = { success: false, error: 'Unauthorized', timestamp: Date.now() }
      return c.json(response, 401)
    }

    const payload = verifyToken(token, c.env.JWT_SECRET)
    if (!payload) {
      const response: APIResponse = { success: false, error: 'Unauthorized', timestamp: Date.now() }
      return c.json(response, 401)
    }

    const body = await c.req.json()
    const { name } = body as { name?: string }

    const user = await getUserById(c.env, payload.userId)
    if (!user) {
      const response: APIResponse = { success: false, error: 'Not Found', timestamp: Date.now() }
      return c.json(response, 404)
    }

    if (name) {
      user.name = name
    }
    user.updatedAt = Date.now()

    await c.env.USERS_KV.put(`user:${user.id}`, JSON.stringify(user))

    const { passwordHash: _, ...safeUser } = user

    const response: APIResponse<{ user: Omit<typeof user, 'passwordHash'> }> = {
      success: true,
      data: { user: safeUser as Omit<typeof user, 'passwordHash'> },
      timestamp: Date.now(),
    }
    return c.json(response)
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: 'User Error',
      message: error instanceof Error ? error.message : 'Failed to update profile',
      timestamp: Date.now(),
    }
    return c.json(response, 500)
  }
})
