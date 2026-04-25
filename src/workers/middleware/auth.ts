import { sign, verify } from 'hono/jwt'
import type { Context, Next } from 'hono'
import type { Env, JWTPayload } from '../types'
import { AppError } from './error-handler'

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Missing or invalid authorization header', timestamp: Date.now() }, 401)
  }

  const token = authHeader.substring(7)

  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256') as unknown as JWTPayload

    if (!payload.userId || !payload.email) {
      throw new AppError('Invalid token payload', 401)
    }

    c.set('jwtPayload', payload)
    await next()
  } catch (err) {
    if (err instanceof AppError) {
      throw err
    }

    return c.json({ success: false, error: 'Invalid or expired token', timestamp: Date.now() }, 401)
  }
}

export function requireRole(roles: string[]) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('jwtPayload') as JWTPayload

    if (!user || !roles.includes(user.email.split('@')[0])) {
      return c.json({ success: false, error: 'Insufficient permissions', timestamp: Date.now() }, 403)
    }

    await next()
  }
}

export { sign }
export { verify }