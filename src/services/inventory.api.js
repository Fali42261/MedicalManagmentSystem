import { backendClient } from './backendClient'
import { mapMedicineFromApi } from './medicine.api'

export const inventoryApi = Object.freeze({
  getMovements: (take = 30) => backendClient.get('/inventory/movements', { take }),
  adjust: (payload) => backendClient.post('/inventory/adjustments', payload).then(response => ({
    ...response,
    medicine: mapMedicineFromApi(response.medicine),
  })),
})
