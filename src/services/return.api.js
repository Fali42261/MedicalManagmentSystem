import { BACKEND_API_ENDPOINTS } from '../constants/api.constants'
import { backendClient } from './backendClient'
const map = x => ({ ...x, code: x.returnNumber, type: 'Sales return', party: x.customerName, invoice: x.invoiceNumber, date: x.createdAtUtc, amount: Number(x.amount) })
export const returnApi = Object.freeze({ getAll: () => backendClient.get(BACKEND_API_ENDPOINTS.RETURNS, { page: 1, pageSize: 200 }).then(r => r.items.map(map)), createSale: p => backendClient.post(BACKEND_API_ENDPOINTS.SALES_RETURNS, p).then(map) })

