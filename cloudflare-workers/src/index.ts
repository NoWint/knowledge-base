import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { authRouter } from './auth/routes'
import { syncRouter } from './sync/routes'
import { subscriptionRouter } from './subscription/routes'
import { usersRouter } from './users/routes'
import { errorHandler } from './middleware/error-handler'
import { contentTypeJson } from './middleware/content-type'
import type { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', logger())
app.use('*', cors({
  origin: (origin, c) => {
    const env = c.env.ENVIRONMENT || 'development'
    if (env === 'production') {
      return ['https://knowledgestudy.com', 'https://www.knowledgestudy.com'].includes(origin)
        ? origin
        : 'https://knowledgestudy.com'
    }
    return origin || 'http://localhost:3000'
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Device-Id', 'X-Client-Version'],
  maxAge: 86400,
}))

app.use('*', contentTypeJson)

app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Knowledge Base API v1.0',
    timestamp: Date.now(),
    endpoints: {
      auth: '/api/auth',
      sync: '/api/sync',
      subscription: '/api/subscription',
      users: '/api/users',
    }
  })
})

app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: Date.now() })
})

app.route('/api/auth', authRouter)
app.route('/api/sync', syncRouter)
app.route('/api/subscription', subscriptionRouter)
app.route('/api/users', usersRouter)

app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
    message: `Route ${c.req.path} not found`,
  }, 404)
})

app.onError((err, c) => {
  return errorHandler(err, c)
})

export default app
