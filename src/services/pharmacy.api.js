import { API_ENDPOINTS, API_QUERY } from '../constants/api.constants'
import { apiClient } from './apiClient'

export const pharmacyApi = Object.freeze({
  getProducts: () => apiClient.get(API_ENDPOINTS.PRODUCTS, { limit: API_QUERY.DASHBOARD_LIMIT }),
  getUsers: () => apiClient.get(API_ENDPOINTS.USERS, { limit: API_QUERY.DIRECTORY_LIMIT }),
  getCarts: () => apiClient.get(API_ENDPOINTS.CARTS, { limit: API_QUERY.TRANSACTION_LIMIT }),
  getTodos: () => apiClient.get(API_ENDPOINTS.TODOS, { limit: API_QUERY.TRANSACTION_LIMIT }),

  addPartner: (payload) => apiClient.add(`${API_ENDPOINTS.USERS}/add`, payload),
  editPartner: (id, payload) => apiClient.edit(API_ENDPOINTS.USER_BY_ID(id), payload),
  deletePartner: (id) => apiClient.delete(API_ENDPOINTS.USER_BY_ID(id)),

  addTransaction: (payload) => apiClient.add(`${API_ENDPOINTS.CARTS}/add`, payload),
  editTransaction: (id, payload) => apiClient.edit(API_ENDPOINTS.CART_BY_ID(id), payload),
  deleteTransaction: (id) => apiClient.delete(API_ENDPOINTS.CART_BY_ID(id)),
})
