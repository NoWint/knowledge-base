const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.knowledgestudy.com'
const API_PREFIX = '/api'

export const API_ENDPOINTS = {
  auth: {
    register: `${API_PREFIX}/auth/register`,
    login: `${API_PREFIX}/auth/login`,
    logout: `${API_PREFIX}/auth/logout`,
    me: `${API_PREFIX}/auth/me`,
    refresh: `${API_PREFIX}/auth/refresh`,
  },
  sync: {
    push: `${API_PREFIX}/sync/push`,
    pull: `${API_PREFIX}/sync/pull`,
    status: `${API_PREFIX}/sync/status`,
    resolveConflict: `${API_PREFIX}/sync/resolve-conflict`,
  },
  subscription: {
    plans: `${API_PREFIX}/subscription/plans`,
    create: `${API_PREFIX}/subscription/create`,
    status: `${API_PREFIX}/subscription/status`,
    cancel: `${API_PREFIX}/subscription/cancel`,
    renew: `${API_PREFIX}/subscription/renew`,
    checkFeature: (feature: string) => `${API_PREFIX}/subscription/features/${feature}`,
    checkDevice: `${API_PREFIX}/subscription/device-check`,
  },
  users: {
    profile: `${API_PREFIX}/users/profile`,
  },
} as const

export { API_BASE_URL }
