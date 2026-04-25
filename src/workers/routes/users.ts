import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import type { Context } from 'hono'
import type { Env, User, JWTPayload } from '../types'
import { createSuccessResponse, createErrorResponse } from '../types'
import { authMiddleware } from '../middleware/auth'
import { AppError } from '../middleware/error-handler'
import { createUserKV } from '../kv'

export const usersRouter = new Hono<{ Bindings: Env }>()

usersRouter.post('/register', async (c: Context<{ Bindings: Env }>) => {
  try {
    const { email, name, password } = await c.req.json<{
      email: string
      name: string
      password: string
    }>()

    if (!email || !name || !password) {
      throw new AppError('Missing required fields', 400)
    }

    const userKV = createUserKV(c.env)

    const existingUser = await userKV.getByEmail(email)
    if (existingUser) {
      return c.json(createErrorResponse('User already exists'), 409)
    }

    const user: User = {
      id: crypto.randomUUID(),
      email,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await userKV.put(user)

    const token = await sign(
      { userId: user.id, email: user.email, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 },
      c.env.JWT_SECRET
    )

    const result = createSuccessResponse({ user, token })

    return c.json(result, 201)
  } catch (err) {
    console.error('Register error:', err)
    const message = err instanceof Error ? err.message : 'Registration failed'
    return c.json(createErrorResponse(message), 500)
  }
})

usersRouter.post('/login', async (c: Context<{ Bindings: Env }>) => {
  try {
    const { email, password } = await c.req.json<{
      email: string
      password: string
    }>()

    if (!email || !password) {
      throw new AppError('Missing email or password', 400)
    }

    const userKV = createUserKV(c.env)
    const user = await userKV.getByEmail(email)

    if (!user) {
      return c.json(createErrorResponse('Invalid credentials'), 401)
    }

    const result = createSuccessResponse({
      user,
      token: 'token-placeholder',
    })

    return c.json(result)
  } catch (err) {
    console.error('Login error:', err)
    const message = err instanceof Error ? err.message : 'Login failed'
    return c.json(createErrorResponse(message), 500)
  }
})

usersRouter.get('/me', authMiddleware, async (c: Context<{ Bindings: Env }>) => {
  try {
    const jwtPayload = c.get('jwtPayload') as JWTPayload
    const userKV = createUserKV(c.env)
    const fullUser = await userKV.get(jwtPayload.userId)

    if (!fullUser) {
      return c.json(createErrorResponse('User not found'), 404)
    }

    return c.json(createSuccessResponse(fullUser))
  } catch (err) {
    console.error('Get user error:', err)
    const message = err instanceof Error ? err.message : 'Failed to get user'
    return c.json(createErrorResponse(message), 500)
  }
})

usersRouter.put('/me', authMiddleware, async (c: Context<{ Bindings: Env }>) => {
  try {
    const jwtPayload = c.get('jwtPayload') as JWTPayload
    const updates = await c.req.json<{ name?: string; email?: string }>()

    const userKV = createUserKV(c.env)
    const existingUser = await userKV.get(jwtPayload.userId)

    if (!existingUser) {
      return c.json(createErrorResponse('User not found'), 404)
    }

    const updatedUser: User = {
      ...existingUser,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await userKV.put(updatedUser)

    return c.json(createSuccessResponse(updatedUser))
  } catch (err) {
    console.error('Update user error:', err)
    const message = err instanceof Error ? err.message : 'Failed to update user'
    return c.json(createErrorResponse(message), 500)
  }
})

usersRouter.delete('/me', authMiddleware, async (c: Context<{ Bindings: Env }>) => {
  try {
    const jwtPayload = c.get('jwtPayload') as JWTPayload
    const userKV = createUserKV(c.env)

    await userKV.delete(jwtPayload.userId)

    return c.json(createSuccessResponse({ deleted: true }))
  } catch (err) {
    console.error('Delete user error:', err)
    const message = err instanceof Error ? err.message : 'Failed to delete user'
    return c.json(createErrorResponse(message), 500)
  }
})