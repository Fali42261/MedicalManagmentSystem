import { backendClient } from './backendClient'
import { sessionService } from './session.service'

export const authApi = Object.freeze({
  login: (payload) => backendClient.post('/auth/login', payload, true).then(sessionService.save),
  signup: (payload) => backendClient.post('/auth/signup', payload, true).then(sessionService.save),
  getNavigation: () => backendClient.get('/navigation/me'),
  getSession: sessionService.get,
  saveSession: sessionService.save,
  clearSession: sessionService.clear,
})
