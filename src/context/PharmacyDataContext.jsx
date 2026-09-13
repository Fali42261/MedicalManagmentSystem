import { useCallback, useEffect, useMemo, useState } from 'react'
import { pharmacyApi } from '../services/pharmacy.api'
import { mapApiData } from '../utils/apiMappers'
import { PharmacyDataContext } from './pharmacyData.context'

export function PharmacyDataProvider({ children }) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })

  const load = useCallback(async () => {
    setState(current => ({ ...current, loading: true, error: '' }))
    try {
      const [products, users, carts, todos] = await Promise.all([
        pharmacyApi.getProducts(),
        pharmacyApi.getUsers(),
        pharmacyApi.getCarts(),
        pharmacyApi.getTodos(),
      ])
      setState({
        loading: false,
        error: '',
        data: mapApiData({ products: products.products, users: users.users, carts: carts.carts, todos: todos.todos }),
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
    const created = await pharmacyApi.addMedicine({ title: payload.name, price: payload.sale, stock: payload.stock, category: payload.category })
    const medicine = { ...payload, id: created.id, status: payload.stock <= payload.minStock ? 'Low stock' : 'In stock' }
    updateCollection('medicines', rows => [medicine, ...rows])
    return medicine
  }, [updateCollection])

  const updateMedicine = useCallback(async (id, payload) => {
    await pharmacyApi.editMedicine(id, { title: payload.name, price: payload.sale, stock: payload.stock })
    updateCollection('medicines', rows => rows.map(row => row.id === id ? { ...row, ...payload, status: payload.stock <= payload.minStock ? 'Low stock' : row.status } : row))
  }, [updateCollection])

  const deleteMedicine = useCallback(async (id) => {
    await pharmacyApi.deleteMedicine(id)
    updateCollection('medicines', rows => rows.filter(row => row.id !== id))
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

  const mutations = useMemo(() => ({ createMedicine, updateMedicine, deleteMedicine, createPartner, deletePartner, createTransaction }), [createMedicine, updateMedicine, deleteMedicine, createPartner, deletePartner, createTransaction])
  const value = useMemo(() => ({ ...state, reload: load, api: pharmacyApi, mutations }), [state, load, mutations])
  return <PharmacyDataContext.Provider value={value}>{children}</PharmacyDataContext.Provider>
}
