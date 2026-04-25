import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { errorHandler, notFoundHandler } from './middleware/error-handler'
import { usersRouter } from './routes/users'
import { syncRouter } from './routes/sync'
import { subscriptionsRouter } from './routes/subscriptions'
import type { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({
  origin: (origin) => origin,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['X-Request-Id'],
  maxAge: 86400,
}))

app.use('*', errorHandler)

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() })
})

app.route('/api/users', usersRouter)
app.route('/api/sync', syncRouter)
app.route('/api/subscriptions', subscriptionsRouter)

app.notFound(notFoundHandler)

export default app