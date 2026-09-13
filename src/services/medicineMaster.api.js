import { BACKEND_API_ENDPOINTS } from '../constants/api.constants'
import { backendClient } from './backendClient'

export const MASTER_TABS = Object.freeze({ Categories: 'Category', Manufacturers: 'Manufacturer', 'Salt / Generic': 'Generic' })

export const groupMedicineMasters = (items = []) => Object.fromEntries(
  Object.entries(MASTER_TABS).map(([tab, type]) => [tab, items.filter(item => item.type === type)]),
)

export const medicineMasterApi = Object.freeze({
  getAll: () => backendClient.get(BACKEND_API_ENDPOINTS.MEDICINE_MASTERS, { page: 1, pageSize: 200 }).then(response => groupMedicineMasters(response.items)),
  create: (payload) => backendClient.post(BACKEND_API_ENDPOINTS.MEDICINE_MASTERS, payload),
  update: (id, payload) => backendClient.put(BACKEND_API_ENDPOINTS.MEDICINE_MASTER_BY_ID(id), payload),
  delete: (id) => backendClient.delete(BACKEND_API_ENDPOINTS.MEDICINE_MASTER_BY_ID(id)),
})
