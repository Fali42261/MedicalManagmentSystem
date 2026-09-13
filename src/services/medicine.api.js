import { backendClient } from './backendClient'

const fromApi = (medicine) => ({
  ...medicine,
  expiry: medicine.expiryDate?.slice(0, 7) || '',
})

const toApi = (medicine, includeVersion = false) => ({
  name: medicine.name,
  generic: medicine.generic,
  category: medicine.category,
  manufacturer: medicine.manufacturer || '',
  dosageForm: medicine.dosageForm || '',
  strength: medicine.strength || '',
  batch: medicine.batch,
  expiryDate: medicine.expiry?.length === 7 ? `${medicine.expiry}-01` : medicine.expiry,
  purchase: Number(medicine.purchase),
  sale: Number(medicine.sale),
  stock: Number(medicine.stock),
  minStock: Number(medicine.minStock),
  gst: Number(String(medicine.gst || 0).replace('%', '')),
  rack: medicine.rack || '',
  ...(includeVersion ? { rowVersion: medicine.rowVersion } : {}),
})

export const medicineApi = Object.freeze({
  getAll: () => backendClient.get('/medicines', { page: 1, pageSize: 200, sortBy: 'name' }).then(response => response.items.map(fromApi)),
  create: (payload) => backendClient.post('/medicines', toApi(payload)).then(fromApi),
  update: (id, payload) => backendClient.put(`/medicines/${id}`, toApi(payload, true)).then(fromApi),
  delete: (id) => backendClient.delete(`/medicines/${id}`),
})
