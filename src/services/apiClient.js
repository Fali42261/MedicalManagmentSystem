import { env } from '../config/env'
import { API_HEADERS, HTTP_METHODS } from '../constants/api.constants'

const buildUrl = (path, query) => {
  const url = new URL(`${env.apiBaseUrl}${path}`)
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  })
  return url.toString()
}

const request = async (path, options = {}, attempt = 0) => {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), env.apiTimeoutMs)

  try {
    const response = await fetch(buildUrl(path, options.query), {
      method: options.method || HTTP_METHODS.GET,
      headers: { ...API_HEADERS.JSON, ...options.headers },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    })

    if (!response.ok) throw new Error(`API request failed (${response.status})`)
    if (response.status === 204) return null
    return response.json()
  } catch (error) {
    if (attempt < env.apiRetryCount && error.name !== 'AbortError') {
      return request(path, options, attempt + 1)
    }
    throw new Error(error.name === 'AbortError' ? 'API request timed out' : error.message)
  } finally {
    window.clearTimeout(timeout)
  }
}

export const apiClient = Object.freeze({
  get: (path, query) => request(path, { query }),
  add: (path, payload) => request(path, { method: HTTP_METHODS.POST, body: payload }),
  edit: (path, payload) => request(path, { method: HTTP_METHODS.PUT, body: payload }),
  patch: (path, payload) => request(path, { method: HTTP_METHODS.PATCH, body: payload }),
  delete: (path) => request(path, { method: HTTP_METHODS.DELETE }),
})
