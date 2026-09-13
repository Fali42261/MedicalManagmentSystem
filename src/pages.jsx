import { useMemo, useState } from 'react'
import Icon from './components/Icon'
import { invoices, medicines, purchases, reportRows, returns, salesTrend, suppliers } from './data'

const money = (value) => `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

function PageHeader({ title, description, children }) {
  return (
    <div className="page-header">
      <div><h1>{title}</h1><p>{description}</p></div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  )
}

function Button({ children, variant = 'primary', icon, onClick, type = 'button', disabled = false }) {
  return <button className={`button button--${variant}`} onClick={onClick} type={type} disabled={disabled}>{icon && <Icon name={icon} size={17} />}{children}</button>
}

function SearchBox({ value, onChange, placeholder = 'Search...' }) {
  return <label className="search-box"><Icon name="search" size={17} /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>
}

function Panel({ title, action, children, className = '' }) {
  return <section className={`panel ${className}`}><div className="panel__header"><h2>{title}</h2>{action}</div>{children}</section>
}

function DataTable({ headers, children, className = '' }) {
  return <div className={`table-wrap ${className}`}><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>
}

function DetailModal({ title, description, onClose, children, footer }) {
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="modal detail-modal"><div className="modal__header"><div><h2>{title}</h2><p>{description}</p></div><button className="icon-button" type="button" onClick={onClose}><Icon name="close"/></button></div><div className="detail-modal__body">{children}</div>{footer && <div className="modal__footer">{footer}</div>}</section></div>
}

function SalesChart({ compact = false }) {
  const points = salesTrend.map((value, index) => `${(index / (salesTrend.length - 1)) * 100},${90 - value}`).join(' ')
  return (
    <div className={`sales-chart ${compact ? 'sales-chart--compact' : ''}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Sales trend chart">
        <defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--primary)" stopOpacity=".22"/><stop offset="1" stopColor="var(--primary)" stopOpacity="0"/></linearGradient></defs>
        <path className="chart-grid" d="M0 20H100M0 45H100M0 70H100M0 95H100" />
        <polygon points={`0,100 ${points} 100,100`} fill="url(#chartFill)" />
        <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      {!compact && <div className="chart-labels"><span>30 Aug</span><span>3 Sep</span><span>7 Sep</span><span>12 Sep</span></div>}
    </div>
  )
}

export function Dashboard({ navigate }) {
  return (
    <>
      <PageHeader title="Overview" description="Here’s how your medical store is performing today.">
        <Button variant="secondary" icon="plus" onClick={() => navigate('medicines')}>Add medicine</Button>
        <Button icon="cart" onClick={() => navigate('sales')}>Create sale</Button>
      </PageHeader>
      <div className="stats-grid">
        <div className="stat-card stat-card--wide">
          <div className="stat-card__top"><div><span>Today’s sales</span><strong>₹24,580</strong></div><Badge tone="success">↑ 12.4%</Badge></div>
          <div className="stat-card__meta"><span>₹4,82,300 this month</span><span>126 invoices</span></div>
          <SalesChart compact />
        </div>
        <div className="stat-card"><span>Current stock</span><strong>1,428</strong><p><b className="positive">+3.2%</b> vs last week</p><div className="stat-icon stat-icon--indigo"><Icon name="box" /></div></div>
        <div className="stat-card"><span>Low stock</span><strong>18</strong><p>Needs reordering</p><div className="stat-icon stat-icon--danger"><Icon name="alert" /></div></div>
        <div className="stat-card"><span>Expiring soon</span><strong>12</strong><p>Within next 30 days</p><div className="stat-icon stat-icon--warning"><Icon name="pill" /></div></div>
      </div>
      <div className="dashboard-grid">
        <Panel title="Sales performance" action={<select className="compact-select" defaultValue="14"><option value="14">Last 14 days</option><option value="30">Last 30 days</option></select>}>
          <div className="chart-kpis"><div><span>Gross sales</span><strong>₹1,28,450</strong></div><div><span>Gross profit</span><strong>₹42,680</strong></div><div><span>Margin</span><strong>33.2%</strong></div></div>
          <SalesChart />
        </Panel>
        <Panel title="Quick actions">
          <div className="quick-actions">
            {[['cart','New sale','sales'],['receipt','Add purchase','purchases'],['pill','Add medicine','medicines'],['truck','Add supplier','suppliers']].map(([icon,label,page]) => <button key={label} onClick={() => navigate(page)}><span><Icon name={icon} size={18}/>{label}</span><Icon name="chevron" size={16}/></button>)}
          </div>
        </Panel>
        <Panel title="Recent sales" action={<button className="text-button" onClick={() => navigate('sales')}>View all</button>} className="panel--span-2">
          <DataTable headers={['Invoice','Customer','Items','Payment','Total','Status']}>
            {invoices.map((invoice) => <tr key={invoice.id}><td><b className="primary-text">{invoice.id}</b><small>{invoice.time}</small></td><td>{invoice.customer}</td><td>{invoice.items}</td><td>{invoice.payment}</td><td><b>{money(invoice.total)}</b></td><td><Badge tone="success">{invoice.status}</Badge></td></tr>)}
          </DataTable>
        </Panel>
        <Panel title="Stock alerts" action={<button className="text-button" onClick={() => navigate('inventory')}>View all</button>}>
          <div className="alert-list">
            {medicines.filter((item) => item.status !== 'In stock').map((item) => <div className="alert-row" key={item.id}><span className={`alert-dot ${item.status === 'Expiring' ? 'warning' : ''}`}><Icon name="alert" size={16}/></span><div><b>{item.name}</b><small>{item.batch} · Rack {item.rack}</small></div><div><strong>{item.stock}</strong><small>left</small></div></div>)}
          </div>
        </Panel>
      </div>
    </>
  )
}

function MedicineModal({ item, onClose, onSave }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={(e) => { e.preventDefault(); onSave() }}>
        <div className="modal__header"><div><h2>{item ? 'Edit medicine' : 'Add medicine'}</h2><p>{item ? 'Update medicine, pricing and reorder information.' : 'Create a medicine with batch, pricing and stock details.'}</p></div><button className="icon-button" type="button" onClick={onClose}><Icon name="close" /></button></div>
        <div className="form-section"><h3>Medicine details</h3><div className="form-grid"><label>Medicine name<input required defaultValue={item?.name} placeholder="e.g. Paracetamol 500mg" /></label><label>Generic name<input required defaultValue={item?.generic} placeholder="e.g. Paracetamol" /></label><label>Category<select defaultValue={item?.category || 'Analgesic'}><option>Analgesic</option><option>Antibiotic</option><option>Vitamin</option><option>Antacid</option><option>Anti-diabetic</option></select></label><label>Manufacturer<input placeholder="Manufacturer name" /></label><label>Dosage form<select><option>Tablet</option><option>Capsule</option><option>Syrup</option><option>Injection</option></select></label><label>Strength<input placeholder="500mg" /></label></div></div>
        <div className="form-section"><h3>Batch, pricing and stock</h3><div className="form-grid"><label>Batch number<input required defaultValue={item?.batch} placeholder="Batch no." /></label><label>Expiry date<input required type="month" /></label><label>Purchase price<input required type="number" step="0.01" defaultValue={item?.purchase} placeholder="₹ 0.00" /></label><label>Sale price<input required type="number" step="0.01" defaultValue={item?.sale} placeholder="₹ 0.00" /></label><label>Opening stock<input required type="number" defaultValue={item?.stock} placeholder="0" /></label><label>Minimum stock<input type="number" defaultValue={item?.minStock} placeholder="10" /></label><label>GST rate<select><option>5%</option><option>12%</option><option>18%</option></select></label><label>Rack number<input defaultValue={item?.rack} placeholder="e.g. A-01" /></label></div></div>
        <div className="modal__footer"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" icon="check">{item ? 'Update medicine' : 'Save medicine'}</Button></div>
      </form>
    </div>
  )
}

export function Medicines({ showToast }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All status')
  const [showModal, setShowModal] = useState(false)
  const [editMedicine, setEditMedicine] = useState(null)
  const visible = medicines.filter((item) => `${item.name} ${item.generic} ${item.batch}`.toLowerCase().includes(search.toLowerCase()) && (status === 'All status' || item.status === status))
  return (
    <>
      <PageHeader title="Medicines" description="Manage medicine master, batches, pricing and tax information."><Button icon="plus" onClick={() => setShowModal(true)}>Add medicine</Button></PageHeader>
      <Panel title="Medicine master" action={<Badge>{visible.length} medicines</Badge>}>
        <div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search medicine, generic name or batch..."/><select value={status} onChange={(e) => setStatus(e.target.value)}><option>All status</option><option>In stock</option><option>Low stock</option><option>Expiring</option></select><Button variant="secondary" icon="filter" onClick={() => showToast('Medicine filters applied')}>Filters</Button></div>
        <DataTable headers={['Medicine','Category','Batch / Expiry','Stock','Purchase','Sale','Rack','Status','']}>
          {visible.map((item) => <tr key={item.id}><td><div className="medicine-cell"><span><Icon name="pill" size={17}/></span><div><b>{item.name}</b><small>{item.generic}</small></div></div></td><td>{item.category}</td><td><b>{item.batch}</b><small>{item.expiry}</small></td><td><b className={item.stock < item.minStock ? 'danger-text' : ''}>{item.stock}</b><small>Min. {item.minStock}</small></td><td>{money(item.purchase)}</td><td><b>{money(item.sale)}</b></td><td>{item.rack}</td><td><Badge tone={item.status === 'In stock' ? 'success' : item.status === 'Expiring' ? 'warning' : 'danger'}>{item.status}</Badge></td><td><button className="icon-button" onClick={() => setEditMedicine(item)}><Icon name="edit" size={17}/></button></td></tr>)}
        </DataTable>
        <div className="pagination"><span>Showing 1–{visible.length} of {medicines.length}</span><div><button disabled>‹</button><button className="active">1</button><button disabled>›</button></div></div>
      </Panel>
      {showModal && <MedicineModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); showToast('Medicine saved successfully') }}/>} 
      {editMedicine && <MedicineModal
        item={editMedicine}
        onClose={() => setEditMedicine(null)}
        onSave={() => { setEditMedicine(null); showToast('Medicine updated successfully') }}
      />}
    </>
  )
}

export function Inventory({ showToast }) {
  const [view, setView] = useState('All stock')
  const [adjusting, setAdjusting] = useState(false)
  const filtered = view === 'All stock' ? medicines : medicines.filter((item) => view === 'Low stock' ? item.stock < item.minStock : item.status === 'Expiring')
  return (
    <>
      <PageHeader title="Inventory" description="Track batch-wise stock, expiry and reorder levels."><Button variant="secondary" icon="download" onClick={() => showToast('Stock register exported')}>Export stock</Button><Button icon="edit" onClick={() => setAdjusting(!adjusting)}>Stock adjustment</Button></PageHeader>
      {adjusting && <Panel title="Record stock adjustment" className="inline-form-panel"><form className="workflow-form" onSubmit={(e) => { e.preventDefault(); setAdjusting(false); showToast('Stock adjustment recorded') }}><label>Medicine<select>{medicines.map((item) => <option key={item.id}>{item.name} · {item.batch}</option>)}</select></label><label>Adjustment<select><option>Add stock</option><option>Remove stock</option><option>Opening correction</option></select></label><label>Quantity<input required min="1" type="number" placeholder="0"/></label><label>Reason<input required placeholder="Damage, count correction..."/></label><Button type="submit" icon="check">Save adjustment</Button></form></Panel>}
      <div className="mini-stats"><div><Icon name="box"/><span>Stock value<b>₹3,42,680</b></span></div><div><Icon name="pill"/><span>Total units<b>1,428</b></span></div><div><Icon name="alert"/><span>Low stock<b className="danger-text">18</b></span></div><div><Icon name="return"/><span>Near expiry<b className="warning-text">12</b></span></div></div>
      <Panel title="Stock register">
        <div className="tabs">{['All stock','Low stock','Near expiry'].map((tab) => <button className={view === tab ? 'active' : ''} onClick={() => setView(tab)} key={tab}>{tab}</button>)}</div>
        <DataTable headers={['Medicine','Batch','Expiry','Rack','Available','Min. level','Stock value','Health']}>
          {filtered.map((item) => { const health = Math.min(100, Math.round((item.stock / Math.max(item.minStock * 3, 1)) * 100)); return <tr key={item.id}><td><b>{item.name}</b><small>{item.generic}</small></td><td>{item.batch}</td><td>{item.expiry}</td><td>{item.rack}</td><td><b>{item.stock}</b></td><td>{item.minStock}</td><td>{money(item.stock * item.purchase)}</td><td><div className="health-cell"><span><i style={{width:`${health}%`}}></i></span><small>{health}%</small></div></td></tr> })}
        </DataTable>
      </Panel>
    </>
  )
}

export function Suppliers({ showToast }) {
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState(null)
  const visible = suppliers.filter((item) => `${item.name} ${item.contact} ${item.city}`.toLowerCase().includes(search.toLowerCase()))
  return (
    <>
      <PageHeader title="Suppliers" description="Manage supplier contacts, purchases and outstanding balances."><Button icon="plus" onClick={() => setAdding(!adding)}>Add supplier</Button></PageHeader>
      {adding && <Panel title="New supplier" className="inline-form-panel"><form className="inline-form" onSubmit={(e) => { e.preventDefault(); setAdding(false); showToast('Supplier saved successfully') }}><label>Business name<input required placeholder="Supplier name"/></label><label>Contact person<input placeholder="Full name"/></label><label>Phone<input required placeholder="+91"/></label><label>GSTIN<input placeholder="GST number"/></label><Button type="submit">Save supplier</Button></form></Panel>}
      <Panel title="Supplier directory" action={<Badge>{visible.length} active</Badge>}>
        <div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search suppliers..."/><Button variant="secondary" icon="download" onClick={() => showToast('Supplier directory exported')}>Export</Button></div>
        <DataTable headers={['Supplier','Contact','Location','Outstanding','Last purchase','Status','']}>
          {visible.map((supplier) => <tr key={supplier.id}><td><b>{supplier.name}</b><small>{supplier.id}</small></td><td>{supplier.contact}<small>{supplier.phone}</small></td><td>{supplier.city}</td><td><b className={supplier.balance ? 'warning-text' : ''}>{money(supplier.balance)}</b></td><td>8 Sep 2026</td><td><Badge tone="success">{supplier.status}</Badge></td><td><button className="icon-button" onClick={() => setSelected(supplier)}><Icon name="chevron" size={17}/></button></td></tr>)}
        </DataTable>
      </Panel>
      {selected && <DetailModal title={selected.name} description={`${selected.id} · Active supplier`} onClose={() => setSelected(null)} footer={<><Button variant="ghost" onClick={() => setSelected(null)}>Close</Button><Button icon="edit" onClick={() => { setSelected(null); setAdding(true) }}>Edit supplier</Button></>}><div className="record-grid"><div><span>Contact person</span><b>{selected.contact}</b></div><div><span>Phone</span><b>{selected.phone}</b></div><div><span>Location</span><b>{selected.city}</b></div><div><span>Outstanding</span><b className="warning-text">{money(selected.balance)}</b></div></div><Panel title="Recent purchase activity"><DataTable headers={['Invoice','Date','Amount','Payment']}><tr><td><b className="primary-text">PUR-2024-0412</b></td><td>12 Sep 2026</td><td><b>₹24,580</b></td><td>Part paid</td></tr></DataTable></Panel></DetailModal>}
    </>
  )
}

export function Purchases({ showToast }) {
  const [create, setCreate] = useState(false)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [lines, setLines] = useState(medicines.slice(0, 3).map((item, index) => ({ ...item, qty: [100, 50, 30][index] })))
  const subtotal = lines.reduce((sum, item) => sum + item.purchase * item.qty, 0)
  return (
    <>
      <PageHeader title="Purchases" description="Record supplier invoices and receive stock batch-wise."><Button icon="plus" onClick={() => setCreate(!create)}>New purchase</Button></PageHeader>
      {create ? <Panel title="Create purchase invoice" action={<button className="text-button" onClick={() => setCreate(false)}>Back to purchases</button>}>
        <form onSubmit={(e) => { e.preventDefault(); setCreate(false); showToast('Purchase recorded and stock updated') }}>
          <div className="document-fields"><label>Supplier<select><option>Sun Pharma Distributors</option><option>Cipla Healthcare Supply</option></select></label><label>Supplier invoice<input defaultValue="SPD-2026-0912"/></label><label>Invoice date<input type="date" defaultValue="2026-09-12"/></label><label>Payment<select><option>Credit</option><option>Cash</option><option>Bank</option></select></label></div>
          <DataTable headers={['Medicine','Batch','Expiry','Qty','Rate','GST','Amount','']}>
            {lines.map((item) => <tr key={item.id}><td><b>{item.name}</b></td><td><input className="table-input" defaultValue={item.batch}/></td><td><input className="table-input" defaultValue={item.expiry}/></td><td><input className="table-input table-input--small" type="number" value={item.qty} onChange={(e) => setLines(rows => rows.map(row => row.id === item.id ? {...row, qty: Math.max(1, Number(e.target.value))} : row))}/></td><td><input className="table-input table-input--small" type="number" value={item.purchase} onChange={(e) => setLines(rows => rows.map(row => row.id === item.id ? {...row, purchase: Math.max(0, Number(e.target.value))} : row))}/></td><td>12%</td><td><b>{money(item.purchase * item.qty)}</b></td><td><button type="button" className="icon-button danger-text" onClick={() => setLines(rows => rows.filter(row => row.id !== item.id))}><Icon name="trash" size={16}/></button></td></tr>)}
          </DataTable>
          <div className="document-footer"><Button variant="secondary" icon="plus" onClick={() => { const next = medicines.find(item => !lines.some(row => row.id === item.id)); if (next) setLines(rows => [...rows, {...next, qty: 1}]); else showToast('All available medicines are already added') }}>Add item</Button><div className="totals"><span>Subtotal<b>{money(subtotal)}</b></span><span>GST (12%)<b>{money(subtotal * .12)}</b></span><strong>Total amount<b>{money(subtotal * 1.12)}</b></strong><Button type="submit" icon="check" disabled={!lines.length}>Save purchase</Button></div></div>
        </form>
      </Panel> : <Panel title="Purchase history"><div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search invoice or supplier..."/><select><option>All payments</option><option>Paid</option><option>Credit</option></select></div><DataTable headers={['Purchase no.','Supplier','Date','Items','Payment','Total','Status','']}>
        {purchases.filter(purchase => `${purchase.id} ${purchase.supplier}`.toLowerCase().includes(search.toLowerCase())).map((purchase) => <tr key={purchase.id}><td><b className="primary-text">{purchase.id}</b></td><td>{purchase.supplier}</td><td>{purchase.date}</td><td>{purchase.items}</td><td>{purchase.payment}</td><td><b>{money(purchase.total)}</b></td><td><Badge tone="success">{purchase.status}</Badge></td><td><button className="icon-button" onClick={() => setSelected(purchase)}><Icon name="chevron" size={17}/></button></td></tr>)}
      </DataTable></Panel>}
      {selected && <DetailModal title={selected.id} description="Purchase invoice details" onClose={() => setSelected(null)} footer={<><Button variant="ghost" onClick={() => setSelected(null)}>Close</Button><Button icon="print" onClick={() => showToast('Purchase invoice sent to printer')}>Print invoice</Button></>}><div className="record-grid"><div><span>Supplier</span><b>{selected.supplier}</b></div><div><span>Invoice date</span><b>{selected.date}</b></div><div><span>Items</span><b>{selected.items}</b></div><div><span>Total</span><b>{money(selected.total)}</b></div><div><span>Payment</span><b>{selected.payment}</b></div><div><span>Status</span><Badge tone="success">{selected.status}</Badge></div></div></DetailModal>}
    </>
  )
}

export function Sales({ showToast }) {
  const [cart, setCart] = useState([{...medicines[0], qty: 2}, {...medicines[2], qty: 1}])
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState(false)
  const [payment, setPayment] = useState('Cash')
  const [addingCustomer, setAddingCustomer] = useState(false)
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const subtotal = cart.reduce((sum, item) => sum + item.sale * item.qty, 0)
  const updateQty = (id, amount) => setCart((items) => items.map((item) => item.id === id ? {...item, qty: Math.max(1, item.qty + amount)} : item))
  const addItem = (item) => setCart((items) => items.some((row) => row.id === item.id) ? items.map((row) => row.id === item.id ? {...row, qty: row.qty + 1} : row) : [...items, {...item, qty: 1}])
  const suggestions = useMemo(() => medicines.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5), [query])
  return (
    <>
      <PageHeader title="Sales & Billing" description="Fast pharmacy POS with batch-aware stock deduction."><Button variant="secondary" icon={history ? 'cart' : 'receipt'} onClick={() => setHistory(!history)}>{history ? 'New sale' : 'View invoices'}</Button></PageHeader>
      {history ? <Panel title="Sales invoice history" action={<Badge>{invoices.length} invoices</Badge>}><div className="toolbar"><SearchBox value={invoiceSearch} onChange={setInvoiceSearch} placeholder="Search invoice or customer..."/><Button variant="secondary" icon="download" onClick={() => showToast('Invoice register exported')}>Export</Button></div><DataTable headers={['Invoice','Customer','Time','Items','Payment','Total','Status','']}>
        {invoices.filter(invoice => `${invoice.id} ${invoice.customer}`.toLowerCase().includes(invoiceSearch.toLowerCase())).map((invoice) => <tr key={invoice.id}><td><b className="primary-text">{invoice.id}</b></td><td>{invoice.customer}</td><td>{invoice.time}</td><td>{invoice.items}</td><td>{invoice.payment}</td><td><b>{money(invoice.total)}</b></td><td><Badge tone="success">{invoice.status}</Badge></td><td><button className="text-button" onClick={() => showToast(`${invoice.id} ready to print`)}>Print</button></td></tr>)}
      </DataTable></Panel> : <div className="pos-layout">
        <Panel title="New sale" className="pos-main">
          <div className="pos-search"><SearchBox value={query} onChange={setQuery} placeholder="Scan barcode or search medicine..."/></div>
          <div className="product-strip">{suggestions.map((item) => <button key={item.id} onClick={() => addItem(item)}><span><Icon name="pill" size={18}/></span><div><b>{item.name}</b><small>{item.stock} in stock · {money(item.sale)}</small></div><Icon name="plus" size={16}/></button>)}</div>
          <DataTable headers={['Item','Batch','Expiry','Qty','Price','GST','Amount','']}>
            {cart.map((item) => <tr key={item.id}><td><b>{item.name}</b><small>{item.generic}</small></td><td>{item.batch}</td><td>{item.expiry}</td><td><div className="qty-control"><button type="button" onClick={() => updateQty(item.id,-1)}>−</button><span>{item.qty}</span><button type="button" onClick={() => updateQty(item.id,1)}>+</button></div></td><td>{money(item.sale)}</td><td>12%</td><td><b>{money(item.sale * item.qty)}</b></td><td><button className="icon-button danger-text" onClick={() => setCart((items) => items.filter((row) => row.id !== item.id))}><Icon name="trash" size={16}/></button></td></tr>)}
          </DataTable>
        </Panel>
        <aside className="bill-panel">
          <h2>Bill summary</h2>
          <label>Customer (optional)<select><option>Walk-in customer</option><option>Ramesh Kumar</option></select></label>
          <button className="add-customer" onClick={() => setAddingCustomer(!addingCustomer)}><Icon name="plus" size={15}/> Add customer</button>
          {addingCustomer && <form className="pos-customer" onSubmit={(e) => { e.preventDefault(); setAddingCustomer(false); showToast('Customer added to current bill') }}><input required placeholder="Customer name"/><input required placeholder="Phone number"/><Button type="submit">Add to bill</Button></form>}
          <div className="bill-divider"></div>
          <div className="bill-line"><span>Subtotal</span><b>{money(subtotal)}</b></div><div className="bill-line"><span>Discount</span><b>− ₹0</b></div><div className="bill-line"><span>GST included</span><b>{money(subtotal * .12)}</b></div><div className="bill-total"><span>Total</span><strong>{money(subtotal)}</strong></div>
          <label>Payment method<div className="payment-options">{['Cash','UPI','Card'].map((item) => <button className={payment === item ? 'active' : ''} type="button" key={item} onClick={() => setPayment(item)}>{item}</button>)}</div></label>
          <Button icon="check" disabled={!cart.length} onClick={() => { showToast(`Sale completed by ${payment} — invoice INV-1049 created`); setCart([]) }}>Complete sale</Button>
          <Button variant="secondary" icon="print" disabled={!cart.length} onClick={() => showToast('Invoice saved and sent to printer')}>Save & print invoice</Button>
        </aside>
      </div>}
    </>
  )
}

export function Returns({ showToast }) {
  const [type, setType] = useState('All returns')
  const [creating, setCreating] = useState(false)
  const visible = type === 'All returns' ? returns : returns.filter((item) => item.type === type)
  return (
    <><PageHeader title="Returns" description="Manage sale returns, purchase returns and stock impact."><Button icon="plus" onClick={() => setCreating(!creating)}>Create return</Button></PageHeader>{creating && <Panel title="Create return voucher" className="inline-form-panel"><form className="workflow-form workflow-form--wide" onSubmit={(e) => { e.preventDefault(); setCreating(false); showToast('Return voucher created and stock updated') }}><label>Return type<select><option>Sales return</option><option>Purchase return</option></select></label><label>Against invoice<input required placeholder="INV-1048"/></label><label>Customer / supplier<input required placeholder="Party name"/></label><label>Reason<select><option>Damaged</option><option>Wrong item</option><option>Expired</option><option>Customer request</option></select></label><label>Amount<input required min="1" type="number" placeholder="₹ 0"/></label><Button type="submit" icon="check">Save return</Button></form></Panel>}<Panel title="Return register"><div className="tabs">{['All returns','Sales return','Purchase return'].map((tab) => <button key={tab} className={type === tab ? 'active' : ''} onClick={() => setType(tab)}>{tab}</button>)}</div><DataTable headers={['Return no.','Type','Customer / Supplier','Against invoice','Date','Reason','Amount','Status']}>
      {visible.map((item) => <tr key={item.id}><td><b className="primary-text">{item.id}</b></td><td>{item.type}</td><td>{item.party}</td><td>{item.invoice}</td><td>{item.date}</td><td>{item.reason}</td><td><b>{money(item.amount)}</b></td><td><Badge tone={item.status === 'Completed' ? 'success' : 'warning'}>{item.status}</Badge></td></tr>)}
    </DataTable></Panel></>
  )
}

export function Reports({ showToast }) {
  return (
    <><PageHeader title="Reports" description="Review sales, purchases, inventory and profitability."><Button variant="secondary" icon="download" onClick={() => showToast('Excel report exported')}>Export Excel</Button><Button variant="secondary" icon="download" onClick={() => showToast('PDF report exported')}>Export PDF</Button></PageHeader>
      <Panel title="Report filters" className="filter-panel"><div className="report-filters"><label>From<input type="date" defaultValue="2026-09-01"/></label><label>To<input type="date" defaultValue="2026-09-12"/></label><label>Report type<select><option>Sales vs purchase</option><option>Stock valuation</option><option>Expiry report</option><option>Gross profit</option></select></label><Button onClick={() => showToast('Report filters applied')}>Apply filters</Button></div></Panel>
      <div className="report-stats"><div><span>Total sales</span><b>₹4,82,300</b><small className="positive">+8.4%</small></div><div><span>Total purchases</span><b>₹3,12,450</b><small>64.8% of sales</small></div><div><span>Gross profit</span><b>₹1,69,850</b><small className="positive">35.2% margin</small></div><div><span>Stock value</span><b>₹3,42,680</b><small>At purchase price</small></div></div>
      <div className="reports-grid"><Panel title="Sales vs purchases"><div className="bar-chart">{[52,68,46,79,63,86,72,90,68,82,94,76].map((value,index) => <div key={index}><i style={{height:`${value}%`}}></i><em style={{height:`${value*.65}%`}}></em></div>)}</div><div className="chart-legend"><span><i></i>Sales</span><span><i></i>Purchases</span></div></Panel><Panel title="Top-selling medicines"><DataTable headers={['Medicine','Units','Sales','Profit']}>{reportRows.map((row) => <tr key={row.name}><td><b>{row.name}</b></td><td>{row.sold}</td><td>{money(row.sales)}</td><td><b className="positive">{money(row.profit)}</b></td></tr>)}</DataTable></Panel></div>
    </>
  )
}

const masterData = {
  Categories: [
    ['CAT-001', 'Analgesic', '18 medicines'], ['CAT-002', 'Antibiotic', '24 medicines'], ['CAT-003', 'Antacid', '15 medicines'], ['CAT-004', 'Vitamin', '21 medicines'], ['CAT-005', 'Anti-diabetic', '12 medicines'],
  ],
  Manufacturers: [
    ['MFG-001', 'Sun Pharmaceutical', '36 medicines'], ['MFG-002', 'Cipla Limited', '29 medicines'], ['MFG-003', 'Dr. Reddy’s Laboratories', '22 medicines'], ['MFG-004', 'Mankind Pharma', '18 medicines'], ['MFG-005', 'Abbott India', '16 medicines'],
  ],
  'Salt / Generic': [
    ['SLT-001', 'Paracetamol', '8 brands'], ['SLT-002', 'Amoxicillin', '6 brands'], ['SLT-003', 'Cetirizine', '5 brands'], ['SLT-004', 'Omeprazole', '7 brands'], ['SLT-005', 'Metformin', '9 brands'],
  ],
}

export function Masters({ showToast }) {
  const [tab, setTab] = useState('Categories')
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  return (
    <>
      <PageHeader title="Medicine Masters" description="Maintain categories, manufacturers and salt/generic names."><Button icon="plus" onClick={() => setAdding(!adding)}>Add {tab === 'Salt / Generic' ? 'salt' : tab.slice(0, -1).toLowerCase()}</Button></PageHeader>
      {(adding || editing) && <Panel title={editing ? `Edit ${tab.toLowerCase()}` : `New ${tab === 'Salt / Generic' ? 'salt / generic' : tab.slice(0, -1).toLowerCase()}`} className="inline-form-panel"><form className="master-form" onSubmit={(e) => { e.preventDefault(); setAdding(false); setEditing(null); showToast(`${tab} master ${editing ? 'updated' : 'saved'}`) }}><label>Name<input required defaultValue={editing?.[1]} placeholder={`Enter ${tab.toLowerCase()} name`}/></label><label>Description<input defaultValue={editing?.[2]} placeholder="Optional description"/></label><Button type="submit">Save</Button></form></Panel>}
      <Panel title="Master directory" action={<Badge>{masterData[tab].length} records</Badge>}>
        <div className="tabs">{Object.keys(masterData).map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
        <div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder={`Search ${tab.toLowerCase()}...`}/><Button variant="secondary" icon="download" onClick={() => showToast(`${tab} master exported`)}>Export</Button></div>
        <DataTable headers={['Code','Name','Usage','Status','Last updated','']}>
          {masterData[tab].filter(row => row.join(' ').toLowerCase().includes(search.toLowerCase())).map(([code,name,usage]) => <tr key={code}><td><b className="primary-text">{code}</b></td><td><b>{name}</b></td><td>{usage}</td><td><Badge tone="success">Active</Badge></td><td>12 Sep 2026</td><td><button className="icon-button" onClick={() => { setAdding(false); setEditing([code,name,usage]) }}><Icon name="edit" size={16}/></button></td></tr>)}
        </DataTable>
      </Panel>
    </>
  )
}

const customers = [
  { id: 'CUS-001', name: 'Ramesh Kumar', phone: '+91 98111 24560', visits: 18, sales: 12450, credit: 820, last: 'Today, 09:17 AM' },
  { id: 'CUS-002', name: 'Sunita Sharma', phone: '+91 98710 52041', visits: 12, sales: 8920, credit: 0, last: 'Yesterday, 07:42 PM' },
  { id: 'CUS-003', name: 'Amit Patel', phone: '+91 99100 62481', visits: 9, sales: 6180, credit: 450, last: 'Yesterday, 11:03 AM' },
  { id: 'CUS-004', name: 'Neha Verma', phone: '+91 98990 15072', visits: 7, sales: 4240, credit: 0, last: '10 Sep 2026' },
]

export function Customers({ showToast }) {
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState(null)
  const visible = customers.filter((item) => `${item.name} ${item.phone}`.toLowerCase().includes(search.toLowerCase()))
  return (
    <>
      <PageHeader title="Customers" description="Manage customer details, sales history and credit balances."><Button icon="plus" onClick={() => setAdding(!adding)}>Add customer</Button></PageHeader>
      {adding && <Panel title="New customer" className="inline-form-panel"><form className="inline-form customer-form" onSubmit={(e) => { e.preventDefault(); setAdding(false); showToast('Customer saved successfully') }}><label>Customer name<input required placeholder="Full name"/></label><label>Phone<input required placeholder="+91"/></label><label>Email<input type="email" placeholder="Optional"/></label><label>Credit limit<input type="number" placeholder="₹ 0"/></label><Button type="submit">Save customer</Button></form></Panel>}
      <div className="mini-stats customer-stats"><div><Icon name="users"/><span>Total customers<b>248</b></span></div><div><Icon name="receipt"/><span>Credit outstanding<b className="warning-text">₹18,420</b></span></div><div><Icon name="cart"/><span>Repeat customers<b>64%</b></span></div></div>
      <Panel title="Customer directory"><div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search customer or phone..."/><select><option>All customers</option><option>With credit</option></select></div><DataTable headers={['Customer','Phone','Total visits','Lifetime sales','Credit balance','Last purchase','']}>
        {visible.map((customer) => <tr key={customer.id}><td><b>{customer.name}</b><small>{customer.id}</small></td><td>{customer.phone}</td><td>{customer.visits}</td><td><b>{money(customer.sales)}</b></td><td><b className={customer.credit ? 'warning-text' : ''}>{money(customer.credit)}</b></td><td>{customer.last}</td><td><button className="icon-button" onClick={() => setSelected(customer)}><Icon name="chevron" size={16}/></button></td></tr>)}
      </DataTable></Panel>
      {selected && <DetailModal title={selected.name} description={`${selected.id} · Customer account`} onClose={() => setSelected(null)} footer={<><Button variant="ghost" onClick={() => setSelected(null)}>Close</Button><Button onClick={() => { setSelected(null); showToast('Receipt form opened for customer') }}>Record receipt</Button></>}><div className="record-grid"><div><span>Phone</span><b>{selected.phone}</b></div><div><span>Total visits</span><b>{selected.visits}</b></div><div><span>Lifetime sales</span><b>{money(selected.sales)}</b></div><div><span>Credit balance</span><b className={selected.credit ? 'warning-text' : ''}>{money(selected.credit)}</b></div></div><Panel title="Recent activity"><DataTable headers={['Last purchase','Invoices','Account status']}><tr><td>{selected.last}</td><td>{selected.visits}</td><td><Badge tone="success">Active</Badge></td></tr></DataTable></Panel></DetailModal>}
    </>
  )
}

export function Schemes({ showToast }) {
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All status')
  const [editing, setEditing] = useState(null)
  const rows = [
    ['SCH-014', 'Buy 10 Get 1', 'Paracetamol 500mg', 'Quantity scheme', '01–30 Sep 2026', 'Active'],
    ['SCH-013', '5% Vitamin Discount', 'Vitamin category', 'Item discount', '01 Sep–31 Oct 2026', 'Active'],
    ['SCH-012', '₹100 off above ₹2,000', 'Entire bill', 'Bill discount', '01–15 Sep 2026', 'Active'],
    ['SCH-011', 'Stock Clearance', 'Near-expiry items', 'Clearance', 'Ended 31 Aug 2026', 'Expired'],
  ]
  const visible = rows.filter(row => row.join(' ').toLowerCase().includes(search.toLowerCase()) && (status === 'All status' || row[5] === status))
  return <><PageHeader title="Schemes & Discounts" description="Configure item offers, bill discounts and stock-clearance schemes."><Button icon="plus" onClick={() => { setEditing(null); setAdding(!adding) }}>New scheme</Button></PageHeader>{(adding || editing) && <Panel title={editing ? 'Edit scheme' : 'Create scheme'} className="inline-form-panel"><form className="scheme-form" onSubmit={(e)=>{e.preventDefault();setAdding(false);setEditing(null);showToast(editing ? 'Scheme updated successfully' : 'Scheme created successfully')}}><label>Scheme name<input required defaultValue={editing?.[1]} placeholder="Offer name"/></label><label>Scheme type<select defaultValue={editing?.[3]}><option>Quantity scheme</option><option>Item discount</option><option>Bill discount</option><option>Clearance</option></select></label><label>Value<input required placeholder="e.g. 5%"/></label><label>Valid until<input type="date"/></label><Button type="submit">Save scheme</Button></form></Panel>}<div className="mini-stats customer-stats"><div><Icon name="receipt"/><span>Active schemes<b>3</b></span></div><div><Icon name="cart"/><span>Discount given<b>₹8,420</b></span></div><div><Icon name="chart"/><span>Scheme sales<b>₹42,600</b></span></div></div><Panel title="Scheme register"><div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search schemes..."/><select value={status} onChange={(e) => setStatus(e.target.value)}><option>All status</option><option>Active</option><option>Expired</option></select></div><DataTable headers={['Code','Scheme','Applies to','Type','Validity','Status','']}>{visible.map(row=><tr key={row[0]}><td><b className="primary-text">{row[0]}</b></td><td><b>{row[1]}</b></td><td>{row[2]}</td><td>{row[3]}</td><td>{row[4]}</td><td><Badge tone={row[5]==='Active'?'success':'neutral'}>{row[5]}</Badge></td><td><button className="icon-button" onClick={() => { setAdding(false); setEditing(row) }}><Icon name="edit" size={16}/></button></td></tr>)}</DataTable></Panel></>
}

export function Accounts({ showToast }) {
  const [entry, setEntry] = useState('')
  const ledger = [
    ['RCPT-0842','Receipt','Ramesh Kumar','Cash','12 Sep 2026',1250,'Credit'],
    ['PAY-0421','Payment','Sun Pharma Distributors','Bank','12 Sep 2026',8500,'Debit'],
    ['EXP-0198','Expense','Shop electricity','UPI','11 Sep 2026',3240,'Debit'],
    ['RCPT-0841','Receipt','Amit Patel','Cash','11 Sep 2026',450,'Credit'],
  ]
  return <><PageHeader title="Accounts" description="Track cash, bank, expenses and party outstanding balances."><Button variant="secondary" icon="plus" onClick={() => setEntry(entry === 'expense' ? '' : 'expense')}>Add expense</Button><Button icon="plus" onClick={() => setEntry(entry === 'voucher' ? '' : 'voucher')}>Receipt / Payment</Button></PageHeader>{entry && <Panel title={entry === 'expense' ? 'Record expense' : 'Record receipt / payment'} className="inline-form-panel"><form className="workflow-form" onSubmit={(e) => { e.preventDefault(); setEntry(''); showToast(entry === 'expense' ? 'Expense recorded' : 'Account voucher recorded') }}><label>{entry === 'expense' ? 'Expense head' : 'Voucher type'}{entry === 'expense' ? <select><option>Electricity</option><option>Rent</option><option>Staff expense</option><option>Other</option></select> : <select><option>Receipt</option><option>Payment</option></select>}</label><label>Account / party<input required placeholder="Account or party name"/></label><label>Payment mode<select><option>Cash</option><option>Bank</option><option>UPI</option></select></label><label>Amount<input required min="1" type="number" placeholder="₹ 0"/></label><label>Reference<input placeholder="Optional reference"/></label><Button type="submit" icon="check">Save voucher</Button></form></Panel>}<div className="report-stats"><div><span>Cash balance</span><b>₹42,680</b><small>As of today</small></div><div><span>Bank balance</span><b>₹1,84,250</b><small>2 accounts</small></div><div><span>Receivable</span><b className="warning-text">₹18,420</b><small>12 customers</small></div><div><span>Payable</span><b className="danger-text">₹64,800</b><small>4 suppliers</small></div></div><div className="reports-grid"><Panel title="Cash flow"><div className="bar-chart accounts-chart">{[38,52,44,68,57,76,62,81,70,88,78,94].map((v,i)=><div key={i}><i style={{height:`${v}%`}}></i><em style={{height:`${v*.55}%`}}></em></div>)}</div><div className="chart-legend"><span><i></i>Income</span><span><i></i>Expense</span></div></Panel><Panel title="Outstanding summary"><div className="outstanding-list"><div><span>Sun Pharma Distributors<small>Due in 7 days</small></span><b>₹28,450</b></div><div><span>Cipla Healthcare Supply<small>Due in 12 days</small></span><b>₹18,200</b></div><div><span>Wellness Pharma Agency<small>Overdue by 3 days</small></span><b className="danger-text">₹12,600</b></div></div></Panel></div><Panel title="Recent ledger entries" className="account-ledger"><DataTable headers={['Voucher','Type','Account / Party','Mode','Date','Amount','Entry']}>{ledger.map(row=><tr key={row[0]}><td><b className="primary-text">{row[0]}</b></td><td>{row[1]}</td><td><b>{row[2]}</b></td><td>{row[3]}</td><td>{row[4]}</td><td><b>{money(row[5])}</b></td><td><Badge tone={row[6]==='Credit'?'success':'warning'}>{row[6]}</Badge></td></tr>)}</DataTable></Panel></>
}

export function Compliance({ showToast }) {
  const [detail, setDetail] = useState('')
  const filings=[['GSTR-1','Sales outward supplies','Aug 2026','11 Sep 2026','Filed'],['GSTR-3B','Monthly summary','Aug 2026','20 Sep 2026','Due soon'],['E-Invoices','Generated invoices','Sep 2026','42 generated','Active'],['E-Way Bills','Goods movement','Sep 2026','3 generated','Active']]
  return <><PageHeader title="GST & Compliance" description="Monitor GST summaries, e-invoices and filing readiness."><Button variant="secondary" icon="download" onClick={() => showToast('GST data exported for September 2026')}>Export GST data</Button><Button icon="check" onClick={() => showToast('Validation complete — no tax mismatch found')}>Validate entries</Button></PageHeader><div className="compliance-banner"><span><Icon name="check" size={22}/></span><div><b>Books are GST-ready</b><p>All transactions through 12 Sep 2026 are validated. No tax mismatch detected.</p></div><Badge tone="success">Healthy</Badge></div><div className="report-stats"><div><span>Taxable sales</span><b>₹4,12,450</b><small>September 2026</small></div><div><span>Output GST</span><b>₹32,180</b><small>Collected</small></div><div><span>Input GST</span><b>₹24,620</b><small>Available credit</small></div><div><span>Net payable</span><b>₹7,560</b><small>Due 20 Sep</small></div></div>{detail && <Panel title={`${detail} details`} className="inline-form-panel" action={<button className="text-button" onClick={() => setDetail('')}>Close</button>}><div className="detail-summary"><div><span>Validated records</span><b>126</b></div><div><span>Taxable value</span><b>₹4,12,450</b></div><div><span>Tax difference</span><b className="positive">₹0</b></div><div><span>Readiness</span><Badge tone="success">Ready</Badge></div></div></Panel>}<Panel title="Compliance overview"><DataTable headers={['Return / Service','Description','Period','Due / Usage','Status','Action']}>{filings.map(row=><tr key={row[0]}><td><b>{row[0]}</b></td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td><Badge tone={row[4]==='Due soon'?'warning':'success'}>{row[4]}</Badge></td><td><button className="text-button" onClick={() => setDetail(row[0])}>View details</button></td></tr>)}</DataTable></Panel></>
}

export function Stores({ showToast }) {
  const [action, setAction] = useState('')
  const branches=[['STR-001','Main Store','Delhi','1,428','₹3,42,680','Online'],['STR-002','North Branch','Delhi','864','₹1,98,420','Online'],['STR-003','Noida Branch','Noida','742','₹1,64,850','Online']]
  return <><PageHeader title="Stores" description="Manage branches, stock visibility and inter-store transfers."><Button variant="secondary" icon="return" onClick={() => setAction(action === 'transfer' ? '' : 'transfer')}>Stock transfer</Button><Button icon="plus" onClick={() => setAction(action === 'store' ? '' : 'store')}>Add store</Button></PageHeader>{action && <Panel title={action === 'store' ? 'Add store' : 'Create stock transfer'} className="inline-form-panel"><form className="workflow-form" onSubmit={(e) => { e.preventDefault(); setAction(''); showToast(action === 'store' ? 'New store added' : 'Stock transfer created') }}>{action === 'store' ? <><label>Store name<input required placeholder="Branch name"/></label><label>City<input required placeholder="City"/></label><label>Phone<input required placeholder="+91"/></label><label>GST registration<select><option>Use primary GSTIN</option><option>Separate GSTIN</option></select></label></> : <><label>From store<select><option>Main Store</option><option>North Branch</option></select></label><label>To store<select><option>North Branch</option><option>Noida Branch</option></select></label><label>Medicine<select>{medicines.slice(0,4).map(item => <option key={item.id}>{item.name}</option>)}</select></label><label>Quantity<input required min="1" type="number" placeholder="0"/></label></>}<Button type="submit" icon="check">{action === 'store' ? 'Save store' : 'Create transfer'}</Button></form></Panel>}<div className="mini-stats customer-stats"><div><Icon name="store"/><span>Active stores<b>3</b></span></div><div><Icon name="box"/><span>Combined stock<b>3,034</b></span></div><div><Icon name="chart"/><span>Stock value<b>₹7,05,950</b></span></div></div><Panel title="Store directory"><DataTable headers={['Code','Store','Location','Stock units','Stock value','Sync status','']}>{branches.map(row=><tr key={row[0]}><td><b className="primary-text">{row[0]}</b></td><td><b>{row[1]}</b></td><td>{row[2]}</td><td>{row[3]}</td><td><b>{row[4]}</b></td><td><Badge tone="success">{row[5]}</Badge></td><td><button className="icon-button" onClick={() => showToast(`${row[1]} details opened`)}><Icon name="chevron" size={16}/></button></td></tr>)}</DataTable></Panel><Panel title="Recent stock transfers" className="module-gap"><DataTable headers={['Transfer no.','From','To','Items','Date','Status']}><tr><td><b className="primary-text">TRF-0018</b></td><td>Main Store</td><td>North Branch</td><td>14</td><td>11 Sep 2026</td><td><Badge tone="success">Received</Badge></td></tr><tr><td><b className="primary-text">TRF-0017</b></td><td>Main Store</td><td>Noida Branch</td><td>9</td><td>09 Sep 2026</td><td><Badge tone="success">Received</Badge></td></tr></DataTable></Panel></>
}

export function UsersRoles({ showToast }) {
  const [editing, setEditing] = useState('')
  const users=[['USR-001','Ali','admin@alimedical.in','Administrator','All stores','Active'],['USR-002','Rohit Kumar','rohit@alimedical.in','Billing operator','Main Store','Active'],['USR-003','Neha Singh','neha@alimedical.in','Inventory manager','Main Store','Active'],['USR-004','Arun Verma','arun@alimedical.in','Accountant','All stores','Inactive']]
  return <><PageHeader title="Users & Roles" description="Control user access, store permissions and billing powers."><Button icon="plus" onClick={()=>setEditing(editing === 'new' ? '' : 'new')}>Invite user</Button></PageHeader>{editing && <Panel title={editing === 'new' ? 'Invite user' : 'Edit user access'} className="inline-form-panel"><form className="workflow-form" onSubmit={(e) => { e.preventDefault(); setEditing(''); showToast(editing === 'new' ? 'User invitation sent' : 'User permissions updated') }}><label>Full name<input required defaultValue={editing === 'new' ? '' : editing}/></label><label>Email<input required type="email" placeholder="user@store.in"/></label><label>Role<select><option>Billing operator</option><option>Inventory manager</option><option>Accountant</option><option>Administrator</option></select></label><label>Store access<select><option>Main Store</option><option>All stores</option><option>North Branch</option></select></label><Button type="submit" icon="check">Save access</Button></form></Panel>}<div className="roles-grid"><div><span><Icon name="users"/></span><b>Administrator</b><small>Full access · 1 user</small></div><div><span><Icon name="receipt"/></span><b>Billing operator</b><small>Sales access · 1 user</small></div><div><span><Icon name="box"/></span><b>Inventory manager</b><small>Stock access · 1 user</small></div><div><span><Icon name="chart"/></span><b>Accountant</b><small>Accounts access · 1 user</small></div></div><Panel title="User directory"><DataTable headers={['User','Email','Role','Store access','Status','Last login','']}>{users.map(row=><tr key={row[0]}><td><div className="user-cell"><span>{row[1][0]}</span><div><b>{row[1]}</b><small>{row[0]}</small></div></div></td><td>{row[2]}</td><td>{row[3]}</td><td>{row[4]}</td><td><Badge tone={row[5]==='Active'?'success':'neutral'}>{row[5]}</Badge></td><td>Today, 10:24 AM</td><td><button className="icon-button" onClick={() => setEditing(row[1])}><Icon name="edit" size={16}/></button></td></tr>)}</DataTable></Panel></>
}

export function DataTools({ showToast }) {
  const [tool, setTool] = useState('')
  const finish = (message) => { setTool(''); showToast(message) }
  return <><PageHeader title="Data & Backup" description="Protect store data and move records safely."><Button icon="download" onClick={()=>showToast('Backup created successfully')}>Create backup</Button></PageHeader><div className="data-cards"><div><span className="data-icon"><Icon name="box"/></span><div><b>Cloud backup</b><p>Automatic encrypted backup every day at 11:30 PM.</p><Badge tone="success">Up to date</Badge></div><Button variant="secondary" onClick={() => setTool('backup')}>Configure</Button></div><div><span className="data-icon"><Icon name="download"/></span><div><b>Import data</b><p>Import medicine, supplier and opening stock data from Excel.</p><small>XLSX and CSV supported</small></div><Button variant="secondary" onClick={() => setTool('import')}>Start import</Button></div><div><span className="data-icon"><Icon name="return"/></span><div><b>Export business data</b><p>Download master and transaction records for archiving.</p><small>Excel or JSON format</small></div><Button variant="secondary" onClick={() => setTool('export')}>Export data</Button></div><div><span className="data-icon"><Icon name="alert"/></span><div><b>Audit trail</b><p>Review edits, deleted records and operator activity.</p><small>248 events this month</small></div><Button variant="secondary" onClick={() => setTool('audit')}>View activity</Button></div></div>{tool && <Panel title={{backup:'Backup schedule',import:'Import business data',export:'Export business data',audit:'Recent audit activity'}[tool]} className="inline-form-panel" action={<button className="text-button" onClick={() => setTool('')}>Close</button>}>{tool === 'audit' ? <DataTable headers={['Time','User','Module','Action']}><tr><td>Today, 10:24 AM</td><td>Ali</td><td>Sales</td><td>Created invoice INV-1048</td></tr><tr><td>Today, 09:48 AM</td><td>Neha Singh</td><td>Inventory</td><td>Adjusted batch PCM2408</td></tr></DataTable> : <form className="workflow-form" onSubmit={(e) => { e.preventDefault(); finish(tool === 'backup' ? 'Backup schedule updated' : tool === 'import' ? 'Import file validated successfully' : 'Business data export prepared') }}>{tool === 'backup' ? <><label>Frequency<select><option>Daily</option><option>Weekly</option></select></label><label>Backup time<input type="time" defaultValue="23:30"/></label></> : tool === 'import' ? <><label>Data type<select><option>Medicine master</option><option>Suppliers</option><option>Opening stock</option></select></label><label>File<input required type="file" accept=".xlsx,.csv"/></label></> : <><label>Data set<select><option>All business data</option><option>Masters only</option><option>Transactions only</option></select></label><label>Format<select><option>Excel</option><option>JSON</option></select></label></>}<Button type="submit" icon="check">Continue</Button></form>}</Panel>}<Panel title="Backup history"><DataTable headers={['Backup','Created','Type','Size','Created by','Status','']}><tr><td><b>backup-2026-09-12</b></td><td>12 Sep, 11:30 PM</td><td>Automatic</td><td>24.8 MB</td><td>System</td><td><Badge tone="success">Completed</Badge></td><td><button className="text-button" onClick={() => showToast('Backup download started')}>Download</button></td></tr><tr><td><b>backup-2026-09-11</b></td><td>11 Sep, 11:30 PM</td><td>Automatic</td><td>24.3 MB</td><td>System</td><td><Badge tone="success">Completed</Badge></td><td><button className="text-button" onClick={() => showToast('Backup download started')}>Download</button></td></tr></DataTable></Panel></>
}

export function Login({ onLogin, theme, setTheme }) {
  const [resetSent, setResetSent] = useState(false)
  return (
    <div className="login-page">
      <div className="login-brand"><span className="brand__mark"><Icon name="pill" size={22}/></span><b>MediDesk</b><small>Smart pharmacy operations, simplified.</small></div>
      <div className="login-card">
        <div className="login-heading"><div><span>Welcome back</span><h1>Sign in to your store</h1><p>Enter your credentials to continue to MediDesk.</p></div><button className="icon-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}><Icon name={theme === 'light' ? 'moon' : 'sun'} size={19}/></button></div>
        <form onSubmit={(e) => { e.preventDefault(); onLogin() }}><label>Email or username<input required defaultValue="admin@alimedical.in"/></label><label>Password<input required type="password" defaultValue="password"/></label><div className="login-options"><label><input type="checkbox" defaultChecked/> Remember me</label><button type="button" onClick={() => setResetSent(true)}>Forgot password?</button></div><Button type="submit">Sign in</Button></form>
        <p className="demo-note">{resetSent ? 'Password reset instructions sent to the registered email.' : 'Demo access is pre-filled — click Sign in to continue.'}</p>
      </div>
      <footer>© 2026 MediDesk · Secure pharmacy management</footer>
    </div>
  )
}

export function Settings({ theme, setTheme, showToast }) {
  const [section, setSection] = useState('Store profile')
  const sections = ['Store profile','Invoice & GST','Users & roles','Notifications','Data & backup']
  const save = (e) => { e.preventDefault(); showToast(`${section} settings saved`) }
  return (
    <><PageHeader title="Settings" description="Configure store, billing, users and application preferences."/><div className="settings-layout"><div className="settings-nav">{sections.map((item) => <button key={item} className={section === item ? 'active' : ''} onClick={() => setSection(item)}>{item}</button>)}</div><Panel title={section}><form className="settings-form" onSubmit={save}>{section === 'Store profile' && <><div className="store-logo"><span><Icon name="store" size={28}/></span><div><b>Ali Medical Store</b><small>Primary business profile</small></div><Button variant="secondary" onClick={() => showToast('Logo upload opened')}>Change logo</Button></div><div className="form-grid"><label>Business name<input defaultValue="Ali Medical Store"/></label><label>GSTIN<input defaultValue="07ABCDE1234F1Z5"/></label><label>Phone<input defaultValue="+91 98765 43210"/></label><label>Email<input defaultValue="accounts@alimedical.in"/></label><label className="span-2">Address<input defaultValue="Main Market, New Delhi - 110001"/></label></div><div className="preference-row"><div><b>Application theme</b><small>Choose how MediDesk looks on this device.</small></div><div className="theme-choice"><button type="button" className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}><Icon name="sun"/>Light</button><button type="button" className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}><Icon name="moon"/>Dark</button></div></div></>}{section === 'Invoice & GST' && <div className="form-grid"><label>Invoice prefix<input defaultValue="INV"/></label><label>Next invoice number<input type="number" defaultValue="1049"/></label><label>Default GST rate<select defaultValue="12%"><option>5%</option><option>12%</option><option>18%</option></select></label><label>Price display<select><option>Inclusive of GST</option><option>Exclusive of GST</option></select></label><label>Invoice footer<input defaultValue="Thank you for shopping with us"/></label><label>Print size<select><option>80mm thermal</option><option>A4</option></select></label></div>}{section === 'Users & roles' && <div className="settings-list"><label><span><b>Allow billing operators to edit price</b><small>Operators can change sale price within discount limits.</small></span><input type="checkbox" defaultChecked/></label><label><span><b>Require manager approval for returns</b><small>Return vouchers need an administrator PIN.</small></span><input type="checkbox" defaultChecked/></label><label><span><b>Restrict purchase-price visibility</b><small>Only inventory managers and admins can view cost.</small></span><input type="checkbox"/></label></div>}{section === 'Notifications' && <div className="settings-list"><label><span><b>Low-stock alerts</b><small>Notify when stock falls below reorder level.</small></span><input type="checkbox" defaultChecked/></label><label><span><b>Expiry alerts</b><small>Notify 90, 60 and 30 days before expiry.</small></span><input type="checkbox" defaultChecked/></label><label><span><b>Daily sales summary</b><small>Email the closing summary to store administrators.</small></span><input type="checkbox" defaultChecked/></label></div>}{section === 'Data & backup' && <div className="form-grid"><label>Backup frequency<select><option>Daily</option><option>Weekly</option></select></label><label>Backup time<input type="time" defaultValue="23:30"/></label><label>Retention period<select><option>90 days</option><option>180 days</option><option>1 year</option></select></label><label>Export format<select><option>Excel</option><option>JSON</option></select></label></div>}<div className="form-submit"><Button type="submit">Save changes</Button></div></form></Panel></div></>
  )
}
