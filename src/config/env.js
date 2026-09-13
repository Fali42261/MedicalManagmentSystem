const required = (key, fallback) => {
  const value = import.meta.env[key] || fallback
  if (!value) throw new Error(`Missing environment variable: ${key}`)
  return value
}

export const env = Object.freeze({
  apiBaseUrl: required('VITE_API_BASE_URL'),
  apiTimeoutMs: Number(required('VITE_API_TIMEOUT_MS', '12000')),
  apiRetryCount: Number(required('VITE_API_RETRY_COUNT', '1')),
  appName: required('VITE_APP_NAME', 'MediDesk'),
  appEnvironment: required('VITE_APP_ENV', 'development'),
})
