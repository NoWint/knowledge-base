import { hash, compare } from 'bcryptjs'
import { sign, verify as jwtVerify, type JwtPayload } from 'jsonwebtoken'
import type { User, AuthPayload } from '../types'
import type { Env } from '../types'

const SALT_ROUNDS = 10
const TOKEN_EXPIRY = '7d'
const REFRESH_TOKEN_EXPIRY = '30d'

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hashStr: string): Promise<boolean> {
  return await compare(password, hashStr)
}

export function generateToken(user: User, secret: string): string {
  const payload: Omit<AuthPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    userType: user.userType,
  }
  return sign(payload, secret, { expiresIn: TOKEN_EXPIRY })
}

export function generateRefreshToken(user: User, secret: string): string {
  const payload = {
    userId: user.id,
    type: 'refresh',
  }
  return sign(payload, secret, { expiresIn: REFRESH_TOKEN_EXPIRY })
}

export function verifyToken(token: string, secret: string): AuthPayload | null {
  try {
    const payload = jwtVerify(token, secret) as JwtPayload
    return payload as AuthPayload
  } catch {
    return null
  }
}

export function getUserKey(userId: string): string {
  return `user:${userId}`
}

export function getEmailKey(email: string): string {
  return `email:${email.toLowerCase()}`
}

export function getRefreshTokenKey(token: string): string {
  return `refresh:${token}`
}

export async function getUserById(env: Env, userId: string): Promise<User | null> {
  const userData = await env.USERS_KV.get(getUserKey(userId))
  if (!userData) return null
  return JSON.parse(userData) as User
}

export async function getUserByEmail(env: Env, email: string): Promise<User | null> {
  const userId = await env.USERS_KV.get(getEmailKey(email.toLowerCase()))
  if (!userId) return null
  return getUserById(env, userId)
}

export async function createUser(env: Env, userData: {
  email: string
  password: string
  name: string
  userType?: 'student' | 'teacher'
}): Promise<User> {
  const existingUser = await getUserByEmail(env, userData.email)
  if (existingUser) {
    throw new Error('User with this email already exists')
  }

  const passwordHash = await hashPassword(userData.password)
  const now = Date.now()

  const user: User = {
    id: crypto.randomUUID(),
    email: userData.email.toLowerCase(),
    passwordHash,
    name: userData.name,
    userType: userData.userType || 'student',
    subscriptionPlan: 'free',
    deviceIds: [],
    createdAt: now,
    updatedAt: now,
  }

  await env.USERS_KV.put(getUserKey(user.id), JSON.stringify(user))
  await env.USERS_KV.put(getEmailKey(user.email), user.id)

  const { passwordHash: _, ...safeUser } = user
  return safeUser as User
}

export async function authenticateUser(
  env: Env,
  email: string,
  password: string
): Promise<{ user: User; token: string; refreshToken: string } | null> {
  const user = await getUserByEmail(env, email)
  if (!user) return null

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) return null

  const token = generateToken(user, env.JWT_SECRET)
  const refreshToken = generateRefreshToken(user, env.JWT_SECRET)

  return { user, token, refreshToken }
}

export function addDeviceToUser(user: User, deviceId: string): User {
  if (!user.deviceIds.includes(deviceId)) {
    user.deviceIds.push(deviceId)
  }
  return user
}

export function removeDeviceFromUser(user: User, deviceId: string): User {
  user.deviceIds = user.deviceIds.filter(id => id !== deviceId)
  return user
}
