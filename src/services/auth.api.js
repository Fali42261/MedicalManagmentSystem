import { env } from '../config/env'

const SESSION_KEY = 'medidesk-session'

const request = async (path, options = {}) => {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), env.apiTimeoutMs)
  try {
    const response = await fetch(`${env.backendApiBaseUrl}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    })
    const payload = response.status === 204 ? null : await response.json().catch(() => null)
    if (!response.ok) {
      const validationMessage = payload?.errors ? Object.values(payload.errors).flat()[0] : ''
      throw new Error(validationMessage || payload?.detail || payload?.title || `API request failed (${response.status})`)
    }
    return payload
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Backend API request timed out')
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

const saveSession = (session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

const getSession = () => {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY))
    if (!session?.accessToken || new Date(session.expiresAtUtc) <= new Date()) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export const authApi = Object.freeze({
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }).then(saveSession),
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }).then(saveSession),
  getNavigation: (token) => request('/navigation/me', { token }),
  getSession,
  saveSession,
  clearSession: () => localStorage.removeItem(SESSION_KEY),
})
