const currency = (value) => Math.round(Number(value || 0) * 83)
const dateLabel = (offset = 0) => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(Date.now() - offset * 86400000))

export const mapApiData = ({ products = [], users = [], carts = [], todos = [] }) => {
  const medicines = products.map((product, index) => {
    const stock = Number(product.stock || 0)
    const minStock = 12 + (index % 4) * 4
    return {
      id: product.id,
      name: product.title,
      generic: product.brand || product.category,
      category: product.category,
      batch: product.sku || `API-${product.id}`,
      expiry: product.warrantyInformation || 'API managed',
      stock,
      minStock,
      purchase: currency(product.price * (1 - Number(product.discountPercentage || 0) / 100)),
      sale: currency(product.price),
      rack: `R-${String(index + 1).padStart(2, '0')}`,
      status: stock <= minStock ? 'Low stock' : index === 4 ? 'Expiring' : 'In stock',
    }
  })

  const partners = users.map((user, index) => ({
    apiId: user.id,
    id: `SUP-${String(user.id).padStart(3, '0')}`,
    name: user.company?.name || `${user.firstName} ${user.lastName}`,
    contact: `${user.firstName} ${user.lastName}`,
    phone: user.phone,
    city: user.address?.city || '—',
    balance: index % 3 === 2 ? 0 : currency((index + 1) * 47),
    status: 'Active',
    email: user.email,
  }))

  const customers = users.slice(4).map((user, index) => ({
    apiId: user.id,
    id: `CUS-${String(user.id).padStart(3, '0')}`,
    name: `${user.firstName} ${user.lastName}`,
    phone: user.phone,
    email: user.email,
    visits: 4 + index * 3,
    sales: currency((index + 2) * 38),
    credit: index % 2 ? 0 : currency(index * 6),
    last: dateLabel(index),
  }))

  const invoices = carts.map((cart, index) => ({
    id: `INV-${1048 - index}`,
    apiId: cart.id,
    time: index < 2 ? `Today, ${10 - index}:24 AM` : dateLabel(index - 1),
    customer: customers[index % Math.max(customers.length, 1)]?.name || 'Walk-in customer',
    items: cart.totalProducts,
    payment: ['Cash', 'UPI', 'Card'][index % 3],
    total: currency(cart.discountedTotal),
    status: 'Paid',
  }))

  const purchases = carts.slice(0, 5).map((cart, index) => ({
    id: `PUR-2026-${String(412 - index).padStart(4, '0')}`,
    apiId: cart.id,
    supplier: partners[index % Math.max(partners.length, 1)]?.name || 'API Supplier',
    date: dateLabel(index),
    items: cart.totalProducts,
    total: currency(cart.total),
    payment: ['Part paid', 'Paid', 'Credit'][index % 3],
    status: 'Received',
  }))

  const returns = carts.slice(0, 3).map((cart, index) => ({
    id: `RET-${String(21 - index).padStart(3, '0')}`,
    type: index ? 'Purchase return' : 'Sales return',
    party: index ? purchases[index]?.supplier : invoices[index]?.customer,
    invoice: index ? purchases[index]?.id : invoices[index]?.id,
    date: dateLabel(index + 1),
    amount: currency(cart.discountedTotal / 5),
    reason: ['Wrong item', 'Near expiry', 'Damaged pack'][index],
    status: index === 2 ? 'Pending' : 'Completed',
  }))

  const schemes = todos.slice(0, 4).map((todo, index) => [
    `SCH-${String(todo.id).padStart(3, '0')}`,
    todo.todo,
    index % 2 ? 'Selected category' : 'Entire bill',
    ['Quantity scheme', 'Item discount', 'Bill discount', 'Clearance'][index],
    dateLabel(0),
    todo.completed ? 'Active' : 'Draft',
  ])

  const ledger = carts.slice(0, 5).map((cart, index) => [
    `${index % 2 ? 'PAY' : 'RCPT'}-${840 + index}`,
    index % 2 ? 'Payment' : 'Receipt',
    index % 2 ? purchases[index]?.supplier : invoices[index]?.customer,
    ['Cash', 'Bank', 'UPI'][index % 3],
    dateLabel(index),
    currency(cart.discountedTotal),
    index % 2 ? 'Debit' : 'Credit',
  ])

  const branches = users.slice(0, 3).map((user, index) => [
    `STR-${String(index + 1).padStart(3, '0')}`,
    index ? `${user.address?.city || 'City'} Branch` : 'Main Store',
    user.address?.city || '—',
    String(medicines.reduce((sum, item) => sum + item.stock, 0) - index * 124),
    `₹${currency(products.reduce((sum, item) => sum + item.price, 0) * (3 - index)).toLocaleString('en-IN')}`,
    'Online',
  ])

  const appUsers = users.slice(0, 6).map((user, index) => [
    `USR-${String(user.id).padStart(3, '0')}`,
    `${user.firstName} ${user.lastName}`,
    user.email,
    ['Administrator', 'Billing operator', 'Inventory manager', 'Accountant'][index % 4],
    index % 2 ? 'Main Store' : 'All stores',
    index === 5 ? 'Inactive' : 'Active',
  ])

  const filingNames = [['GSTR-1', 'Sales outward supplies'], ['GSTR-3B', 'Monthly summary'], ['E-Invoices', 'Generated invoices'], ['E-Way Bills', 'Goods movement']]
  const filings = todos.slice(0, 4).map((todo, index) => [filingNames[index][0], filingNames[index][1], 'Sep 2026', todo.todo, todo.completed ? 'Filed' : 'Due soon'])
  const backups = carts.slice(0, 4).map((cart, index) => ({
    id: `backup-${dateLabel(index).replaceAll(' ', '-').toLowerCase()}`,
    created: `${dateLabel(index)}, 11:30 PM`,
    type: index ? 'Automatic' : 'Manual',
    size: `${Math.max(8, Math.round(cart.totalProducts * 1.7))} MB`,
    createdBy: index ? 'System' : 'Administrator',
    status: 'Completed',
  }))

  const masterData = {
    Categories: [...new Set(products.map(item => item.category))].slice(0, 8).map((name, index) => [`CAT-${String(index + 1).padStart(3, '0')}`, name, `${products.filter(item => item.category === name).length} products`]),
    Manufacturers: [...new Set(products.map(item => item.brand).filter(Boolean))].slice(0, 8).map((name, index) => [`MFG-${String(index + 1).padStart(3, '0')}`, name, 'API catalogue']),
    'Salt / Generic': medicines.slice(0, 8).map((item, index) => [`SLT-${String(index + 1).padStart(3, '0')}`, item.generic, item.category]),
  }

  const reportRows = medicines.slice(0, 5).map((item, index) => ({ name: item.name, sold: 40 + index * 23, sales: item.sale * (40 + index * 23), profit: (item.sale - item.purchase) * (40 + index * 23) }))
  const salesTrend = carts.length ? [...carts, ...carts].slice(0, 14).map(cart => Math.max(16, Math.min(82, Math.round(cart.discountedTotal / 20)))) : []

  return { medicines, suppliers: partners.slice(0, 5), customers, invoices, purchases, returns, schemes, ledger, filings, branches, users: appUsers, backups, masterData, reportRows, salesTrend }
}
