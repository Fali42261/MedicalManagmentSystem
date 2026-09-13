export const HTTP_METHODS = Object.freeze({
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
})

export const API_ENDPOINTS = Object.freeze({
  PRODUCTS: '/products',
  USERS: '/users',
  USER_BY_ID: (id) => `/users/${id}`,
  CARTS: '/carts',
  CART_BY_ID: (id) => `/carts/${id}`,
  TODOS: '/todos',
  TODO_BY_ID: (id) => `/todos/${id}`,
})

export const BACKEND_API_ENDPOINTS = Object.freeze({
  AUTH_LOGIN: '/auth/login',
  AUTH_SIGNUP: '/auth/signup',
  NAVIGATION_ME: '/navigation/me',
  MEDICINES: '/medicines',
  MEDICINE_BY_ID: (id) => `/medicines/${id}`,
  INVENTORY_MOVEMENTS: '/inventory/movements',
  INVENTORY_ADJUSTMENTS: '/inventory/adjustments',
  MEDICINE_MASTERS: '/medicine-masters',
  MEDICINE_MASTER_BY_ID: (id) => `/medicine-masters/${id}`,
  SUPPLIERS: '/suppliers',
  SUPPLIER_BY_ID: (id) => `/suppliers/${id}`,
  PURCHASES: '/purchases',
  PURCHASE_BY_ID: (id) => `/purchases/${id}`,
  SALES: '/sales',
  SALES_CATALOG: '/sales/catalog',
  SALE_BY_ID: (id) => `/sales/${id}`,
  CUSTOMERS: '/customers',
  CUSTOMER_BY_ID: (id) => `/customers/${id}`,
  RETURNS: '/returns',
  SALES_RETURNS: '/returns/sales',
  SCHEMES: '/schemes', SCHEME_BY_ID: (id) => `/schemes/${id}`,
})

export const API_QUERY = Object.freeze({
  DASHBOARD_LIMIT: 12,
  DIRECTORY_LIMIT: 12,
  TRANSACTION_LIMIT: 8,
})

export const API_HEADERS = Object.freeze({
  JSON: { 'Content-Type': 'application/json' },
})

