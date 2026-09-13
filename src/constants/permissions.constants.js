export const ROLES = Object.freeze({
  ADMINISTRATOR: 'administrator',
  BILLING_OPERATOR: 'billing_operator',
  INVENTORY_MANAGER: 'inventory_manager',
  ACCOUNTANT: 'accountant',
})

export const ROLE_ACCESS = Object.freeze({
  administrator: ['*'],
  billing_operator: ['dashboard', 'medicines', 'sales', 'returns', 'customers'],
  inventory_manager: ['dashboard', 'medicines', 'masters', 'inventory', 'purchases', 'returns', 'suppliers', 'reports'],
  accountant: ['dashboard', 'purchases', 'sales', 'returns', 'suppliers', 'customers', 'accounts', 'compliance', 'reports'],
})

export const canAccessPage = (role, page) => {
  const access = ROLE_ACCESS[role] || []
  return access.includes('*') || access.includes(page)
}
