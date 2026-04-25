import type { Context, Next } from 'hono'
import type { ApiResponse } from '../types'

export async function errorHandler(c: Context, next: Next) {
  try {
    await next()
  } catch (err) {
    const error = err as Error & { statusCode?: number }
    console.error('Error:', error.message, error.stack)

    const response: ApiResponse = {
      success: false,
      error: error.message || 'Internal Server Error',
      timestamp: Date.now(),
    }

    return c.json(response, (error.statusCode || 500) as never)
  }
}

export async function notFoundHandler(c: Context) {
  const response: ApiResponse = {
    success: false,
    error: 'Not Found',
    timestamp: Date.now(),
  }

  return c.json(response, 404 as never)
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleD1Error(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return 'Resource already exists'
    }
    if (error.message.includes('FOREIGN KEY constraint failed')) {
      return 'Referenced resource not found'
    }
    return error.message
  }
  return 'Database error'
}