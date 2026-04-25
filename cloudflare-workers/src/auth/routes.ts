import { Hono } from 'hono'
import type { Env, APIResponse } from '../types'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import {
  createUser,
  authenticateUser,
  getUserById,
  verifyToken,
  addDeviceToUser,
  removeDeviceFromUser,
  generateToken,
  generateRefreshToken,
} from './service'

export const authRouter = new Hono<{ Bindings: Env }>()

authRouter.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password, name, userType } = body

    if (!email || !password || !name) {
      const response: APIResponse = {
        success: false,
        error: 'Validation Error',
        message: 'Email, password, and name are required',
        timestamp: Date.now(),
      }
      return c.json(response, 400)
    }

    if (password.length < 6) {
      const response: APIResponse = {
        success: false,
        error: 'Validation Error',
        message: 'Password must be at least 6 characters',
        timestamp: Date.now(),
      }
      return c.json(response, 400)
    }

    const user = await createUser(c.env, { email, password, name, userType })

    const response: APIResponse<{
      user: Omit<typeof user, 'passwordHash'>
      message: string
    }> = {
      success: true,
      data: {
        user: user as Omit<typeof user, 'passwordHash'>,
        message: 'Registration successful',
      },
      timestamp: Date.now(),
    }
    return c.json(response, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed'
    const response: APIResponse = {
      success: false,
      error: 'Registration Error',
      message,
      timestamp: Date.now(),
    }
    return c.json(response, 400)
  }
})

authRouter.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password, deviceId } = body

    if (!email || !password) {
      const response: APIResponse = {
        success: false,
        error: 'Validation Error',
        message: 'Email and password are required',
        timestamp: Date.now(),
      }
      return c.json(response, 400)
    }

    const result = await authenticateUser(c.env, email, password)
    if (!result) {
      const response: APIResponse = {
        success: false,
        error: 'Authentication Error',
        message: 'Invalid email or password',
        timestamp: Date.now(),
      }
      return c.json(response, 401)
    }

    if (deviceId) {
      const updatedUser = addDeviceToUser(result.user, deviceId)
      await c.env.USERS_KV.put(`user:${result.user.id}`, JSON.stringify(updatedUser))
    }

    const { passwordHash: _, ...safeUser } = result.user

    const response: APIResponse<{
      user: Omit<typeof result.user, 'passwordHash'>
      token: string
      refreshToken: string
    }> = {
      success: true,
      data: {
        user: safeUser as Omit<typeof result.user, 'passwordHash'>,
        token: result.token,
        refreshToken: result.refreshToken,
      },
      timestamp: Date.now(),
    }
    return c.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed'
    const response: APIResponse = {
      success: false,
      error: 'Login Error',
      message,
      timestamp: Date.now(),
    }
    return c.json(response, 500)
  }
})

authRouter.post('/logout', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    const deviceId = c.req.header('X-Device-Id')

    if (token && deviceId) {
      const payload = verifyToken(token, c.env.JWT_SECRET)
      if (payload) {
        const user = await getUserById(c.env, payload.userId)
        if (user) {
          const updatedUser = removeDeviceFromUser(user, deviceId)
          await c.env.USERS_KV.put(`user:${user.id}`, JSON.stringify(updatedUser))
        }
      }
    }

    const response: APIResponse<{ message: string }> = {
      success: true,
      data: { message: 'Logout successful' },
      timestamp: Date.now(),
    }
    return c.json(response)
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: 'Logout Error',
      message: error instanceof Error ? error.message : 'Logout failed',
      timestamp: Date.now(),
    }
    return c.json(response, 500)
  }
})

authRouter.get('/me', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    if (!token) {
      const response: APIResponse = {
        success: false,
        error: 'Unauthorized',
        message: 'No token provided',
        timestamp: Date.now(),
      }
      return c.json(response, 401)
    }

    const payload = verifyToken(token, c.env.JWT_SECRET)
    if (!payload) {
      const response: APIResponse = {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        timestamp: Date.now(),
      }
      return c.json(response, 401)
    }

    const user = await getUserById(c.env, payload.userId)
    if (!user) {
      const response: APIResponse = {
        success: false,
        error: 'Not Found',
        message: 'User not found',
        timestamp: Date.now(),
      }
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
      error: 'Error',
      message: error instanceof Error ? error.message : 'Failed to get user',
      timestamp: Date.now(),
    }
    return c.json(response, 500)
  }
})

authRouter.post('/refresh', async (c) => {
  try {
    const { refreshToken } = await c.req.json()
    if (!refreshToken) {
      const response: APIResponse = {
        success: false,
        error: 'Validation Error',
        message: 'Refresh token is required',
        timestamp: Date.now(),
      }
      return c.json(response, 400)
    }

    const payload = verifyToken(refreshToken, c.env.JWT_SECRET) as { userId: string; type: string } | null
    if (!payload || payload.type !== 'refresh') {
      const response: APIResponse = {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid refresh token',
        timestamp: Date.now(),
      }
      return c.json(response, 401)
    }

    const user = await getUserById(c.env, payload.userId)
    if (!user) {
      const response: APIResponse = {
        success: false,
        error: 'Not Found',
        message: 'User not found',
        timestamp: Date.now(),
      }
      return c.json(response, 404)
    }

    const token = generateToken(user, c.env.JWT_SECRET)
    const newRefreshToken = generateRefreshToken(user, c.env.JWT_SECRET)

    const response: APIResponse<{ token: string; refreshToken: string }> = {
      success: true,
      data: { token, refreshToken: newRefreshToken },
      timestamp: Date.now(),
    }
    return c.json(response)
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: 'Error',
      message: error instanceof Error ? error.message : 'Failed to refresh token',
      timestamp: Date.now(),
    }
    return c.json(response, 500)
  }
})
