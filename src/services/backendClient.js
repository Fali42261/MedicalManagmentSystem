import { env } from '../config/env'
import { sessionService } from './session.service'

const request = async (path, options = {}) => {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), env.apiTimeoutMs)
  const token = options.anonymous ? null : sessionService.get()?.accessToken
  const url = new URL(`${env.backendApiBaseUrl}${path}`)
  Object.entries(options.query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  })
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
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

export const backendClient = Object.freeze({
  get: (path, query) => request(path, { query }),
  post: (path, body, anonymous = false) => request(path, { method: 'POST', body, anonymous }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
})
