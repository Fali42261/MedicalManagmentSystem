import { BACKEND_API_ENDPOINTS } from '../constants/api.constants'
import { backendClient } from './backendClient'
import { sessionService } from './session.service'

export const authApi = Object.freeze({
  login: (payload) => backendClient.post(BACKEND_API_ENDPOINTS.AUTH_LOGIN, payload, true).then(sessionService.save),
  signup: (payload) => backendClient.post(BACKEND_API_ENDPOINTS.AUTH_SIGNUP, payload, true).then(sessionService.save),
  getNavigation: () => backendClient.get(BACKEND_API_ENDPOINTS.NAVIGATION_ME),
  getSession: sessionService.get,
  saveSession: sessionService.save,
  clearSession: sessionService.clear,
})
