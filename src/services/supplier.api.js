import { BACKEND_API_ENDPOINTS } from '../constants/api.constants'
import { backendClient } from './backendClient'

const mapSupplierFromApi = (supplier) => ({
  ...supplier,
  name: supplier.businessName,
  contact: supplier.contactPerson,
  balance: Number(supplier.outstandingBalance),
  status: supplier.isActive ? 'Active' : 'Inactive',
})

const toApi = (supplier, includeVersion = false) => ({
  businessName: supplier.name,
  contactPerson: supplier.contact,
  phone: supplier.phone,
  email: supplier.email || null,
  gstin: supplier.gstin || null,
  drugLicenseNumber: supplier.drugLicenseNumber || null,
  address: supplier.address || null,
  city: supplier.city,
  state: supplier.state,
  postalCode: supplier.postalCode || null,
  ...(includeVersion
    ? { isActive: supplier.isActive, rowVersion: supplier.rowVersion }
    : { openingBalance: Number(supplier.openingBalance || 0) }),
})

export const supplierApi = Object.freeze({
  getAll: () => backendClient.get(BACKEND_API_ENDPOINTS.SUPPLIERS, { page: 1, pageSize: 200 }).then(response => response.items.map(mapSupplierFromApi)),
  create: (payload) => backendClient.post(BACKEND_API_ENDPOINTS.SUPPLIERS, toApi(payload)).then(mapSupplierFromApi),
  update: (id, payload) => backendClient.put(BACKEND_API_ENDPOINTS.SUPPLIER_BY_ID(id), toApi(payload, true)).then(mapSupplierFromApi),
  delete: (id) => backendClient.delete(BACKEND_API_ENDPOINTS.SUPPLIER_BY_ID(id)),
})
