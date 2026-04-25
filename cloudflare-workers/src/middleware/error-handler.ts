import { Context, Next } from 'hono'
import type { APIResponse } from '../types'

export async function errorHandler(err: Error, c: Context) {
  console.error('Error:', err)

  if (err.name === 'Unauthorized') {
    const response: APIResponse = {
      success: false,
      error: 'Unauthorized',
      message: err.message || 'Authentication required',
      timestamp: Date.now(),
    }
    return c.json(response, 401)
  }

  if (err.name === 'Forbidden') {
    const response: APIResponse = {
      success: false,
      error: 'Forbidden',
      message: err.message || 'Access denied',
      timestamp: Date.now(),
    }
    return c.json(response, 403)
  }

  if (err.name === 'NotFound') {
    const response: APIResponse = {
      success: false,
      error: 'Not Found',
      message: err.message || 'Resource not found',
      timestamp: Date.now(),
    }
    return c.json(response, 404)
  }

  if (err.name === 'ValidationError') {
    const response: APIResponse = {
      success: false,
      error: 'Validation Error',
      message: err.message || 'Invalid request data',
      timestamp: Date.now(),
    }
    return c.json(response, 400)
  }

  if (err.name === 'ConflictError') {
    const response: APIResponse = {
      success: false,
      error: 'Conflict',
      message: err.message || 'Resource already exists',
      timestamp: Date.now(),
    }
    return c.json(response, 409)
  }

  const response: APIResponse = {
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    timestamp: Date.now(),
  }
  return c.json(response, 500)
}

export class UnauthorizedError extends Error {
  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'Unauthorized'
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Access denied') {
    super(message)
    this.name = 'Forbidden'
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message)
    this.name = 'NotFound'
  }
}

export class ValidationError extends Error {
  constructor(message = 'Invalid request data') {
    super(message)
    this.name = 'ValidationError'
  }
}

export class ConflictError extends Error {
  constructor(message = 'Resource already exists') {
    super(message)
    this.name = 'ConflictError'
  }
}
