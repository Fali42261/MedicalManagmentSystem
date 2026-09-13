import { useCallback, useEffect, useMemo, useState } from 'react'
import { pharmacyApi } from '../services/pharmacy.api'
import { authApi } from '../services/auth.api'
import { medicineApi } from '../services/medicine.api'
import { inventoryApi } from '../services/inventory.api'
import { MASTER_TABS, medicineMasterApi } from '../services/medicineMaster.api'
import { supplierApi } from '../services/supplier.api'
import { purchaseApi } from '../services/purchase.api'
import { saleApi } from '../services/sale.api'
import { customerApi } from '../services/customer.api'
import { returnApi } from '../services/return.api'
import { schemeApi } from '../services/scheme.api'
import { accountApi } from '../services/account.api'
import { reportApi } from '../services/report.api'
import { storeApi, adminUserApi, backupApi } from '../services/admin.api'
import { settingsApi } from '../services/settings.api'
import { mapApiData } from '../utils/apiMappers'
import { PharmacyDataContext } from './pharmacyData.context'

export function PharmacyDataProvider({ children }) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })

  const load = useCallback(async () => {
    setState(current => ({ ...current, loading: true, error: '' }))
    try {
      const session = authApi.getSession()
      const canView = (moduleKey) => session?.menu?.some(item => item.key === moduleKey && item.permissions.includes('View'))
      const [products, users, carts, todos, medicines, inventoryMovements, medicineMasters, suppliers, purchases, sales, saleCatalog, customers, returns, schemes, accounts, reportSummary, complianceSummary, stores, adminUsers, backups, settings] = await Promise.all([
        pharmacyApi.getProducts(),
        pharmacyApi.getUsers(),
        pharmacyApi.getCarts(),
        pharmacyApi.getTodos(),
        canView('medicines') ? medicineApi.getAll() : Promise.resolve(null),
        canView('inventory') ? inventoryApi.getMovements() : Promise.resolve([]),
        canView('masters') ? medicineMasterApi.getAll() : Promise.resolve(null),
        canView('suppliers') ? supplierApi.getAll() : Promise.resolve(null),
        canView('purchases') ? purchaseApi.getAll() : Promise.resolve(null),
        canView('sales') ? saleApi.getAll() : Promise.resolve(null),
        canView('sales') ? saleApi.getCatalog() : Promise.resolve(null),
        canView('customers') ? customerApi.getAll() : Promise.resolve(null),
        canView('returns') ? returnApi.getAll() : Promise.resolve(null),
        canView('schemes') ? schemeApi.getAll() : Promise.resolve(null),
        canView('accounts') ? accountApi.getAll() : Promise.resolve(null),
        canView('reports') ? reportApi.summary({}) : Promise.resolve(null),
        canView('compliance') ? reportApi.compliance({}) : Promise.resolve(null),
        canView('stores') ? storeApi.getAll() : Promise.resolve(null),
        canView('users') ? adminUserApi.getAll() : Promise.resolve(null),
        canView('data-tools') ? backupApi.getAll() : Promise.resolve(null),
        canView('settings') ? settingsApi.get() : Promise.resolve(null),
      ])
      const mapped = mapApiData({ products: products.products, users: users.users, carts: carts.carts, todos: todos.todos })
      if (medicines || saleCatalog) mapped.medicines = medicines || saleCatalog
      mapped.inventoryMovements = inventoryMovements
      if (medicineMasters) mapped.masterData = medicineMasters
      if (suppliers) mapped.suppliers = suppliers
      if (purchases) mapped.purchases = purchases
      if (sales) mapped.invoices = sales
      if (customers) mapped.customers = customers
      if (returns) mapped.returns = returns
      if (schemes) mapped.schemes = schemes
      if (accounts) mapped.ledger = accounts
      if (reportSummary) { mapped.reportRows = reportSummary.topMedicines.map(x => ({ name: x.name, sold: x.units, sales: Number(x.sales), profit: Number(x.profit) })); mapped.reportSummary = reportSummary }
      if (complianceSummary) mapped.complianceSummary = complianceSummary
      if (stores) { mapped.stores = stores; mapped.branches = stores.map(x => [x.code, x.name, `${x.city}, ${x.state}`, '—', '—', x.isActive ? 'Online' : 'Inactive']) }
      if (adminUsers) mapped.adminUsers = adminUsers
      if (backups) mapped.backups = backups.map(x => ({ ...x, id: x.backupNumber, created: new Date(x.createdAtUtc).toLocaleString('en-IN'), type: x.type, size: `${Math.round(x.sizeBytes / 1024)} KB`, createdBy: 'Current user', status: x.status }))
      if (settings) mapped.settings = Object.fromEntries(settings.map(x => [x.key, x.value]))
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

  const refreshSaleDependencies = useCallback(async () => {
    const session = authApi.getSession()
    const canViewInventory = session?.menu?.some(item => item.key === 'inventory' && item.permissions.includes('View'))
    const [medicines, inventoryMovements] = await Promise.all([
      saleApi.getCatalog(), canViewInventory ? inventoryApi.getMovements() : Promise.resolve(null),
    ])
    setState(current => ({ ...current, data: { ...current.data, medicines, ...(inventoryMovements ? { inventoryMovements } : {}) } }))
  }, [])

  const createSale = useCallback(async (payload) => {
    const sale = await saleApi.create(payload)
    updateCollection('invoices', rows => [sale, ...rows])
    await refreshSaleDependencies().catch(() => undefined)
    return sale
  }, [refreshSaleDependencies, updateCollection])

  const getSale = useCallback((id) => saleApi.getById(id), [])

  const cancelSale = useCallback(async (id) => {
    await saleApi.cancel(id)
    updateCollection('invoices', rows => rows.filter(row => row.id !== id))
    await refreshSaleDependencies().catch(() => undefined)
  }, [refreshSaleDependencies, updateCollection])

  const createCustomer = useCallback(async (payload) => { const customer = await customerApi.create(payload); updateCollection('customers', rows => [customer, ...rows]); return customer }, [updateCollection])
  const updateCustomer = useCallback(async (id, payload) => { const customer = await customerApi.update(id, payload); updateCollection('customers', rows => rows.map(row => row.id === id ? customer : row)); return customer }, [updateCollection])
  const deleteCustomer = useCallback(async (id) => { await customerApi.delete(id); updateCollection('customers', rows => rows.filter(row => row.id !== id)) }, [updateCollection])
  const createSaleReturn = useCallback(async (payload) => { const item = await returnApi.createSale(payload); updateCollection('returns', rows => [item, ...rows]); await refreshSaleDependencies().catch(() => undefined); return item }, [refreshSaleDependencies, updateCollection])
  const createScheme = useCallback(async p=>{const x=await schemeApi.create(p);updateCollection('schemes',r=>[x,...r]);return x},[updateCollection]); const updateScheme=useCallback(async(id,p)=>{const x=await schemeApi.update(id,p);updateCollection('schemes',r=>r.map(a=>a.id===id?x:a));return x},[updateCollection]); const deleteScheme=useCallback(async id=>{await schemeApi.delete(id);updateCollection('schemes',r=>r.filter(a=>a.id!==id))},[updateCollection])
  const createAccountEntry = useCallback(async p=>{const x=await accountApi.create(p);const rows=await accountApi.getAll();setState(c=>({...c,data:{...c.data,ledger:rows}}));return x},[])
  const createStore=useCallback(async p=>{const x=await storeApi.create(p);updateCollection('stores',r=>[x,...r]);return x},[updateCollection]); const createUser=useCallback(async p=>{const x=await adminUserApi.create(p);const rows=await adminUserApi.getAll();setState(c=>({...c,data:{...c.data,adminUsers:rows}}));return x},[]); const updateAdminUser=useCallback(async(id,p)=>{await adminUserApi.update(id,p);const rows=await adminUserApi.getAll();setState(c=>({...c,data:{...c.data,adminUsers:rows}}))},[])
  const createBackup=useCallback(async type=>{const x=await backupApi.create(type);const rows=await backupApi.getAll();setState(c=>({...c,data:{...c.data,backups:rows.map(a=>({...a,id:a.backupNumber,created:new Date(a.createdAtUtc).toLocaleString('en-IN'),size:`${Math.round(a.sizeBytes/1024)} KB`,createdBy:'Current user',status:a.status}))}}));return x},[])
  const updateSettings=useCallback(async values=>{const rows=await settingsApi.update(values);setState(c=>({...c,data:{...c.data,settings:Object.fromEntries(rows.map(x=>[x.key,x.value]))}}));return rows},[])

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

  const mutations = useMemo(() => ({ createMedicine, updateMedicine, deleteMedicine, adjustStock, createMedicineMaster, updateMedicineMaster, deleteMedicineMaster, createSupplier, updateSupplier, deleteSupplier, createPurchase, getPurchase, cancelPurchase, createSale, getSale, cancelSale, createCustomer, updateCustomer, deleteCustomer, createSaleReturn, createScheme, updateScheme, deleteScheme, createAccountEntry, createStore, createUser, updateAdminUser, createBackup, updateSettings, createPartner, deletePartner, createTransaction }), [createMedicine, updateMedicine, deleteMedicine, adjustStock, createMedicineMaster, updateMedicineMaster, deleteMedicineMaster, createSupplier, updateSupplier, deleteSupplier, createPurchase, getPurchase, cancelPurchase, createSale, getSale, cancelSale, createCustomer, updateCustomer, deleteCustomer, createSaleReturn, createScheme, updateScheme, deleteScheme, createAccountEntry, createStore, createUser, updateAdminUser, createBackup, updateSettings, createPartner, deletePartner, createTransaction])
  const value = useMemo(() => ({ ...state, reload: load, api: pharmacyApi, mutations }), [state, load, mutations])
  return <PharmacyDataContext.Provider value={value}>{children}</PharmacyDataContext.Provider>
}

