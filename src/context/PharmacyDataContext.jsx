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

  const value = useMemo(() => ({ ...state, reload: load, api: pharmacyApi }), [state, load])
  return <PharmacyDataContext.Provider value={value}>{children}</PharmacyDataContext.Provider>
}
