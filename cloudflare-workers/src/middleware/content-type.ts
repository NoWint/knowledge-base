import { Context, Next } from 'hono'

export async function contentTypeJson(c: Context, next: Next) {
  await next()
  c.res.headers.set('Content-Type', 'application/json; charset=utf-8')
}
