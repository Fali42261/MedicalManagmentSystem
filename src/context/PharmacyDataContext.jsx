import { useCallback, useEffect, useMemo, useState } from 'react'
import { pharmacyApi } from '../services/pharmacy.api'
import { authApi } from '../services/auth.api'
import { medicineApi } from '../services/medicine.api'
import { inventoryApi } from '../services/inventory.api'
import { MASTER_TABS, medicineMasterApi } from '../services/medicineMaster.api'
import { supplierApi } from '../services/supplier.api'
import { purchaseApi } from '../services/purchase.api'
import { mapApiData } from '../utils/apiMappers'
import { PharmacyDataContext } from './pharmacyData.context'

export function PharmacyDataProvider({ children }) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })

  const load = useCallback(async () => {
    setState(current => ({ ...current, loading: true, error: '' }))
    try {
      const session = authApi.getSession()
      const canView = (moduleKey) => session?.menu?.some(item => item.key === moduleKey && item.permissions.includes('View'))
      const [products, users, carts, todos, medicines, inventoryMovements, medicineMasters, suppliers, purchases] = await Promise.all([
        pharmacyApi.getProducts(),
        pharmacyApi.getUsers(),
        pharmacyApi.getCarts(),
        pharmacyApi.getTodos(),
        canView('medicines') ? medicineApi.getAll() : Promise.resolve(null),
        canView('inventory') ? inventoryApi.getMovements() : Promise.resolve([]),
        canView('masters') ? medicineMasterApi.getAll() : Promise.resolve(null),
        canView('suppliers') ? supplierApi.getAll() : Promise.resolve(null),
        canView('purchases') ? purchaseApi.getAll() : Promise.resolve(null),
      ])
      const mapped = mapApiData({ products: products.products, users: users.users, carts: carts.carts, todos: todos.todos })
      if (medicines) mapped.medicines = medicines
      mapped.inventoryMovements = inventoryMovements
      if (medicineMasters) mapped.masterData = medicineMasters
      if (suppliers) mapped.suppliers = suppliers
      if (purchases) mapped.purchases = purchases
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

  const updateMasterCollection = useCallback((type, updater) => {
    const tab = Object.entries(MASTER_TABS).find(([, value]) => value === type)?.[0]
    if (!tab) return
    setState(current => ({ ...current, data: { ...current.data, masterData: { ...current.data.masterData, [tab]: updater(current.data.masterData[tab]) } } }))
  }, [])

  const createMedicineMaster = useCallback(async (payload) => {
    const master = await medicineMasterApi.create(payload)
    updateMasterCollection(master.type, rows => [master, ...rows])
    return master
  }, [updateMasterCollection])

  const updateMedicineMaster = useCallback(async (id, type, payload) => {
    const master = await medicineMasterApi.update(id, payload)
    updateMasterCollection(type, rows => rows.map(row => row.id === id ? master : row))
    return master
  }, [updateMasterCollection])

  const deleteMedicineMaster = useCallback(async (id, type) => {
    await medicineMasterApi.delete(id)
    updateMasterCollection(type, rows => rows.filter(row => row.id !== id))
  }, [updateMasterCollection])

  const createSupplier = useCallback(async (payload) => {
    const supplier = await supplierApi.create(payload)
    updateCollection('suppliers', rows => [supplier, ...rows])
    return supplier
  }, [updateCollection])

  const updateSupplier = useCallback(async (id, payload) => {
    const supplier = await supplierApi.update(id, payload)
    updateCollection('suppliers', rows => rows.map(row => row.id === id ? supplier : row))
    return supplier
  }, [updateCollection])

  const deleteSupplier = useCallback(async (id) => {
    await supplierApi.delete(id)
    updateCollection('suppliers', rows => rows.filter(row => row.id !== id))
  }, [updateCollection])

  const refreshPurchaseDependencies = useCallback(async () => {
    const [medicines, inventoryMovements, suppliers] = await Promise.all([
      medicineApi.getAll(), inventoryApi.getMovements(), supplierApi.getAll(),
    ])
    setState(current => ({ ...current, data: { ...current.data, medicines, inventoryMovements, suppliers } }))
  }, [])

  const createPurchase = useCallback(async (payload) => {
    const purchase = await purchaseApi.create(payload)
    updateCollection('purchases', rows => [purchase, ...rows])
    await refreshPurchaseDependencies().catch(() => undefined)
    return purchase
  }, [refreshPurchaseDependencies, updateCollection])

  const getPurchase = useCallback((id) => purchaseApi.getById(id), [])

  const cancelPurchase = useCallback(async (id) => {
    await purchaseApi.cancel(id)
    updateCollection('purchases', rows => rows.filter(row => row.id !== id))
    await refreshPurchaseDependencies().catch(() => undefined)
  }, [refreshPurchaseDependencies, updateCollection])

  const createPartner = useCallback(async (_type, payload) => {
    const [firstName, ...last] = payload.name.trim().split(' ')
    const created = await pharmacyApi.addPartner({ firstName, lastName: last.join(' '), phone: payload.phone, email: payload.email })
    updateCollection('customers', rows => [{ ...payload, apiId: created.id, id: `CUS-${created.id}`, visits: 0, sales: 0, credit: Number(payload.credit || 0), last: 'No purchases yet' }, ...rows])
  }, [updateCollection])

  const deletePartner = useCallback(async (_type, apiId) => {
    await pharmacyApi.deletePartner(apiId)
    updateCollection('customers', rows => rows.filter(row => row.apiId !== apiId))
  }, [updateCollection])

  const createTransaction = useCallback(async (type, payload) => {
    const created = await pharmacyApi.addTransaction(payload.apiPayload)
    updateCollection(type, rows => [{ ...payload.record, apiId: created.id }, ...rows])
    return created
  }, [updateCollection])

  const mutations = useMemo(() => ({ createMedicine, updateMedicine, deleteMedicine, adjustStock, createMedicineMaster, updateMedicineMaster, deleteMedicineMaster, createSupplier, updateSupplier, deleteSupplier, createPurchase, getPurchase, cancelPurchase, createPartner, deletePartner, createTransaction }), [createMedicine, updateMedicine, deleteMedicine, adjustStock, createMedicineMaster, updateMedicineMaster, deleteMedicineMaster, createSupplier, updateSupplier, deleteSupplier, createPurchase, getPurchase, cancelPurchase, createPartner, deletePartner, createTransaction])
  const value = useMemo(() => ({ ...state, reload: load, api: pharmacyApi, mutations }), [state, load, mutations])
  return <PharmacyDataContext.Provider value={value}>{children}</PharmacyDataContext.Provider>
}
