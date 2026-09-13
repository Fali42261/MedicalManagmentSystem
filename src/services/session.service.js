const SESSION_KEY = 'medidesk-session'

export const sessionService = Object.freeze({
  save: (session) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  },
  get: () => {
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
  },
  clear: () => localStorage.removeItem(SESSION_KEY),
})
