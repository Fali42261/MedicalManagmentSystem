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

export const API_QUERY = Object.freeze({
  DASHBOARD_LIMIT: 12,
  DIRECTORY_LIMIT: 12,
  TRANSACTION_LIMIT: 8,
})

export const API_HEADERS = Object.freeze({
  JSON: { 'Content-Type': 'application/json' },
})
