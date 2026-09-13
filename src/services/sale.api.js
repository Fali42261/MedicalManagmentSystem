import { BACKEND_API_ENDPOINTS } from '../constants/api.constants'
import { backendClient } from './backendClient'
import { mapMedicineFromApi } from './medicine.api'

const mapSale = (sale) => ({
  ...sale,
  code: sale.invoiceNumber,
  customer: sale.customerName,
  time: sale.createdAtUtc,
  items: sale.itemCount ?? sale.items?.length ?? 0,
  lines: sale.items || [],
  payment: sale.paymentMethod,
  total: Number(sale.grandTotal),
})

export const saleApi = Object.freeze({
  getCatalog: () => backendClient.get(BACKEND_API_ENDPOINTS.SALES_CATALOG, { page: 1, pageSize: 200 }).then(response => response.items.map(mapMedicineFromApi)),
  getAll: () => backendClient.get(BACKEND_API_ENDPOINTS.SALES, { page: 1, pageSize: 200 }).then(response => response.items.map(mapSale)),
  getById: (id) => backendClient.get(BACKEND_API_ENDPOINTS.SALE_BY_ID(id)).then(mapSale),
  create: (payload) => backendClient.post(BACKEND_API_ENDPOINTS.SALES, payload).then(mapSale),
  cancel: (id) => backendClient.delete(BACKEND_API_ENDPOINTS.SALE_BY_ID(id)),
})
