import { BACKEND_API_ENDPOINTS } from '../constants/api.constants'
import { backendClient } from './backendClient'

const mapPurchase = (purchase) => ({
  ...purchase,
  lines: purchase.items || [],
  code: purchase.purchaseNumber,
  supplier: purchase.supplierName,
  date: purchase.invoiceDate,
  items: purchase.itemCount ?? purchase.items?.length ?? 0,
  total: Number(purchase.grandTotal),
  payment: purchase.paymentStatus,
})

export const purchaseApi = Object.freeze({
  getAll: () => backendClient.get(BACKEND_API_ENDPOINTS.PURCHASES, { page: 1, pageSize: 200 }).then(response => response.items.map(mapPurchase)),
  getById: (id) => backendClient.get(BACKEND_API_ENDPOINTS.PURCHASE_BY_ID(id)).then(mapPurchase),
  create: (payload) => backendClient.post(BACKEND_API_ENDPOINTS.PURCHASES, payload).then(mapPurchase),
  cancel: (id) => backendClient.delete(BACKEND_API_ENDPOINTS.PURCHASE_BY_ID(id)),
})
