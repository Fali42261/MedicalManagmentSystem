import { BACKEND_API_ENDPOINTS } from '../constants/api.constants'
import { backendClient } from './backendClient'
import { mapMedicineFromApi } from './medicine.api'

export const inventoryApi = Object.freeze({
  getMovements: (take = 30) => backendClient.get(BACKEND_API_ENDPOINTS.INVENTORY_MOVEMENTS, { take }),
  adjust: (payload) => backendClient.post(BACKEND_API_ENDPOINTS.INVENTORY_ADJUSTMENTS, payload).then(response => ({
    ...response,
    medicine: mapMedicineFromApi(response.medicine),
  })),
})
