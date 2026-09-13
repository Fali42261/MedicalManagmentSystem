import { useCallback, useEffect, useMemo, useState } from 'react'
import { pharmacyApi } from '../services/pharmacy.api'
import { authApi } from '../services/auth.api'
import { medicineApi } from '../services/medicine.api'
import { inventoryApi } from '../services/inventory.api'
import { mapApiData } from '../utils/apiMappers'
import { PharmacyDataContext } from './pharmacyData.context'

export function PharmacyDataProvider({ children }) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })

  const load = useCallback(async () => {
    setState(current => ({ ...current, loading: true, error: '' }))
    try {
      const session = authApi.getSession()
      const canView = (moduleKey) => session?.menu?.some(item => item.key === moduleKey && item.permissions.includes('View'))
      const [products, users, carts, todos, medicines, inventoryMovements] = await Promise.all([
        pharmacyApi.getProducts(),
        pharmacyApi.getUsers(),
        pharmacyApi.getCarts(),
        pharmacyApi.getTodos(),
        canView('medicines') ? medicineApi.getAll() : Promise.resolve(null),
        canView('inventory') ? inventoryApi.getMovements() : Promise.resolve([]),
      ])
      const mapped = mapApiData({ products: products.products, users: users.users, carts: carts.carts, todos: todos.todos })
      if (medicines) mapped.medicines = medicines
      mapped.inventoryMovements = inventoryMovements
      setState({
        loading: false,
        error: '',
        data: mapped,
      })
    } catch (error) {
      setState({ data: null, loading: false, error: error.message || 'Unable to load business data' })
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const updateCollection = useCallback((key, updater) => {
    setState(current => ({ ...current, data: { ...current.data, [key]: updater(current.data[key]) } }))
  }, [])

  const createMedicine = useCallback(async (payload) => {
    const medicine = await medicineApi.create(payload)
    updateCollection('medicines', rows => [medicine, ...rows])
    return medicine
  }, [updateCollection])

  const updateMedicine = useCallback(async (id, payload) => {
    const medicine = await medicineApi.update(id, payload)
    updateCollection('medicines', rows => rows.map(row => row.id === id ? medicine : row))
    return medicine
  }, [updateCollection])

  const deleteMedicine = useCallback(async (id) => {
    await medicineApi.delete(id)
    updateCollection('medicines', rows => rows.filter(row => row.id !== id))
  }, [updateCollection])

  const adjustStock = useCallback(async (payload) => {
    const result = await inventoryApi.adjust(payload)
    updateCollection('medicines', rows => rows.map(row => row.id === result.medicine.id ? result.medicine : row))
    updateCollection('inventoryMovements', rows => [result.movement, ...rows].slice(0, 100))
    return result
  }, [updateCollection])

  const createPartner = useCallback(async (type, payload) => {
    const [firstName, ...last] = payload.name.trim().split(' ')
    const created = await pharmacyApi.addPartner({ firstName, lastName: last.join(' '), phone: payload.phone, email: payload.email })
    if (type === 'supplier') {
      updateCollection('suppliers', rows => [{ ...payload, apiId: created.id, id: `SUP-${created.id}`, contact: payload.contact, balance: 0, status: 'Active' }, ...rows])
    } else {
      updateCollection('customers', rows => [{ ...payload, apiId: created.id, id: `CUS-${created.id}`, visits: 0, sales: 0, credit: Number(payload.credit || 0), last: 'No purchases yet' }, ...rows])
    }
  }, [updateCollection])

  const deletePartner = useCallback(async (type, apiId) => {
    await pharmacyApi.deletePartner(apiId)
    updateCollection(type === 'supplier' ? 'suppliers' : 'customers', rows => rows.filter(row => row.apiId !== apiId))
  }, [updateCollection])

  const createTransaction = useCallback(async (type, payload) => {
    const created = await pharmacyApi.addTransaction(payload.apiPayload)
    updateCollection(type, rows => [{ ...payload.record, apiId: created.id }, ...rows])
    return created
  }, [updateCollection])

  const mutations = useMemo(() => ({ createMedicine, updateMedicine, deleteMedicine, adjustStock, createPartner, deletePartner, createTransaction }), [createMedicine, updateMedicine, deleteMedicine, adjustStock, createPartner, deletePartner, createTransaction])
  const value = useMemo(() => ({ ...state, reload: load, api: pharmacyApi, mutations }), [state, load, mutations])
  return <PharmacyDataContext.Provider value={value}>{children}</PharmacyDataContext.Provider>
}
