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

function MedicineModal({ onClose, onSave }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={(e) => { e.preventDefault(); onSave() }}>
        <div className="modal__header"><div><h2>Add medicine</h2><p>Create a medicine with batch, pricing and stock details.</p></div><button className="icon-button" type="button" onClick={onClose}><Icon name="close" /></button></div>
        <div className="form-section"><h3>Medicine details</h3><div className="form-grid"><label>Medicine name<input required placeholder="e.g. Paracetamol 500mg" /></label><label>Generic name<input required placeholder="e.g. Paracetamol" /></label><label>Category<select defaultValue="Analgesic"><option>Analgesic</option><option>Antibiotic</option><option>Vitamin</option><option>Antacid</option></select></label><label>Manufacturer<input placeholder="Manufacturer name" /></label><label>Dosage form<select><option>Tablet</option><option>Capsule</option><option>Syrup</option><option>Injection</option></select></label><label>Strength<input placeholder="500mg" /></label></div></div>
        <div className="form-section"><h3>Batch, pricing and stock</h3><div className="form-grid"><label>Batch number<input required placeholder="Batch no." /></label><label>Expiry date<input required type="month" /></label><label>Purchase price<input required type="number" step="0.01" placeholder="₹ 0.00" /></label><label>Sale price<input required type="number" step="0.01" placeholder="₹ 0.00" /></label><label>Opening stock<input required type="number" placeholder="0" /></label><label>Minimum stock<input type="number" placeholder="10" /></label><label>GST rate<select><option>5%</option><option>12%</option><option>18%</option></select></label><label>Rack number<input placeholder="e.g. A-01" /></label></div></div>
        <div className="modal__footer"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" icon="check">Save medicine</Button></div>
      </form>
    </div>
  )
}

export function Medicines({ showToast }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All status')
  const [showModal, setShowModal] = useState(false)
  const visible = medicines.filter((item) => `${item.name} ${item.generic} ${item.batch}`.toLowerCase().includes(search.toLowerCase()) && (status === 'All status' || item.status === status))
  return (
    <>
      <PageHeader title="Medicines" description="Manage medicine master, batches, pricing and tax information."><Button icon="plus" onClick={() => setShowModal(true)}>Add medicine</Button></PageHeader>
      <Panel title="Medicine master" action={<Badge>{visible.length} medicines</Badge>}>
        <div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search medicine, generic name or batch..."/><select value={status} onChange={(e) => setStatus(e.target.value)}><option>All status</option><option>In stock</option><option>Low stock</option><option>Expiring</option></select><Button variant="secondary" icon="filter">Filters</Button></div>
        <DataTable headers={['Medicine','Category','Batch / Expiry','Stock','Purchase','Sale','Rack','Status','']}>
          {visible.map((item) => <tr key={item.id}><td><div className="medicine-cell"><span><Icon name="pill" size={17}/></span><div><b>{item.name}</b><small>{item.generic}</small></div></div></td><td>{item.category}</td><td><b>{item.batch}</b><small>{item.expiry}</small></td><td><b className={item.stock < item.minStock ? 'danger-text' : ''}>{item.stock}</b><small>Min. {item.minStock}</small></td><td>{money(item.purchase)}</td><td><b>{money(item.sale)}</b></td><td>{item.rack}</td><td><Badge tone={item.status === 'In stock' ? 'success' : item.status === 'Expiring' ? 'warning' : 'danger'}>{item.status}</Badge></td><td><button className="icon-button"><Icon name="edit" size={17}/></button></td></tr>)}
        </DataTable>
        <div className="pagination"><span>Showing 1–{visible.length} of {medicines.length}</span><div><button disabled>‹</button><button className="active">1</button><button>2</button><button>›</button></div></div>
      </Panel>
      {showModal && <MedicineModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); showToast('Medicine saved successfully') }}/>} 
    </>
  )
}

export function Inventory() {
  const [view, setView] = useState('All stock')
  const filtered = view === 'All stock' ? medicines : medicines.filter((item) => view === 'Low stock' ? item.stock < item.minStock : item.status === 'Expiring')
  return (
    <>
      <PageHeader title="Inventory" description="Track batch-wise stock, expiry and reorder levels."><Button variant="secondary" icon="download">Export stock</Button><Button icon="edit">Stock adjustment</Button></PageHeader>
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
  const visible = suppliers.filter((item) => `${item.name} ${item.contact} ${item.city}`.toLowerCase().includes(search.toLowerCase()))
  return (
    <>
      <PageHeader title="Suppliers" description="Manage supplier contacts, purchases and outstanding balances."><Button icon="plus" onClick={() => setAdding(!adding)}>Add supplier</Button></PageHeader>
      {adding && <Panel title="New supplier" className="inline-form-panel"><form className="inline-form" onSubmit={(e) => { e.preventDefault(); setAdding(false); showToast('Supplier saved successfully') }}><label>Business name<input required placeholder="Supplier name"/></label><label>Contact person<input placeholder="Full name"/></label><label>Phone<input required placeholder="+91"/></label><label>GSTIN<input placeholder="GST number"/></label><Button type="submit">Save supplier</Button></form></Panel>}
      <Panel title="Supplier directory" action={<Badge>{visible.length} active</Badge>}>
        <div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search suppliers..."/><Button variant="secondary" icon="download">Export</Button></div>
        <DataTable headers={['Supplier','Contact','Location','Outstanding','Last purchase','Status','']}>
          {visible.map((supplier) => <tr key={supplier.id}><td><b>{supplier.name}</b><small>{supplier.id}</small></td><td>{supplier.contact}<small>{supplier.phone}</small></td><td>{supplier.city}</td><td><b className={supplier.balance ? 'warning-text' : ''}>{money(supplier.balance)}</b></td><td>8 Sep 2026</td><td><Badge tone="success">{supplier.status}</Badge></td><td><button className="icon-button"><Icon name="chevron" size={17}/></button></td></tr>)}
        </DataTable>
      </Panel>
    </>
  )
}

export function Purchases({ showToast }) {
  const [create, setCreate] = useState(false)
  const lines = medicines.slice(0, 3)
  const subtotal = lines.reduce((sum, item, index) => sum + item.purchase * [100, 50, 30][index], 0)
  return (
    <>
      <PageHeader title="Purchases" description="Record supplier invoices and receive stock batch-wise."><Button icon="plus" onClick={() => setCreate(!create)}>New purchase</Button></PageHeader>
      {create ? <Panel title="Create purchase invoice" action={<button className="text-button" onClick={() => setCreate(false)}>Back to purchases</button>}>
        <form onSubmit={(e) => { e.preventDefault(); setCreate(false); showToast('Purchase recorded and stock updated') }}>
          <div className="document-fields"><label>Supplier<select><option>Sun Pharma Distributors</option><option>Cipla Healthcare Supply</option></select></label><label>Supplier invoice<input defaultValue="SPD-2026-0912"/></label><label>Invoice date<input type="date" defaultValue="2026-09-12"/></label><label>Payment<select><option>Credit</option><option>Cash</option><option>Bank</option></select></label></div>
          <DataTable headers={['Medicine','Batch','Expiry','Qty','Rate','GST','Amount','']}>
            {lines.map((item, index) => <tr key={item.id}><td><b>{item.name}</b></td><td><input className="table-input" defaultValue={item.batch}/></td><td><input className="table-input" defaultValue={item.expiry}/></td><td><input className="table-input table-input--small" type="number" defaultValue={[100,50,30][index]}/></td><td><input className="table-input table-input--small" type="number" defaultValue={item.purchase}/></td><td>12%</td><td><b>{money(item.purchase * [100,50,30][index])}</b></td><td><button className="icon-button danger-text"><Icon name="trash" size={16}/></button></td></tr>)}
          </DataTable>
          <div className="document-footer"><Button variant="secondary" icon="plus">Add item</Button><div className="totals"><span>Subtotal<b>{money(subtotal)}</b></span><span>GST (12%)<b>{money(subtotal * .12)}</b></span><strong>Total amount<b>{money(subtotal * 1.12)}</b></strong><Button type="submit" icon="check">Save purchase</Button></div></div>
        </form>
      </Panel> : <Panel title="Purchase history"><div className="toolbar"><SearchBox value="" onChange={() => {}} placeholder="Search invoice or supplier..."/><select><option>All payments</option><option>Paid</option><option>Credit</option></select></div><DataTable headers={['Purchase no.','Supplier','Date','Items','Payment','Total','Status','']}>
        {purchases.map((purchase) => <tr key={purchase.id}><td><b className="primary-text">{purchase.id}</b></td><td>{purchase.supplier}</td><td>{purchase.date}</td><td>{purchase.items}</td><td>{purchase.payment}</td><td><b>{money(purchase.total)}</b></td><td><Badge tone="success">{purchase.status}</Badge></td><td><button className="icon-button"><Icon name="chevron" size={17}/></button></td></tr>)}
      </DataTable></Panel>}
    </>
  )
}

export function Sales({ showToast }) {
  const [cart, setCart] = useState([{...medicines[0], qty: 2}, {...medicines[2], qty: 1}])
  const [query, setQuery] = useState('')
  const subtotal = cart.reduce((sum, item) => sum + item.sale * item.qty, 0)
  const updateQty = (id, amount) => setCart((items) => items.map((item) => item.id === id ? {...item, qty: Math.max(1, item.qty + amount)} : item))
  const addItem = (item) => setCart((items) => items.some((row) => row.id === item.id) ? items.map((row) => row.id === item.id ? {...row, qty: row.qty + 1} : row) : [...items, {...item, qty: 1}])
  const suggestions = useMemo(() => medicines.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5), [query])
  return (
    <>
      <PageHeader title="Sales & Billing" description="Fast pharmacy POS with batch-aware stock deduction."><Button variant="secondary" icon="receipt">View invoices</Button></PageHeader>
      <div className="pos-layout">
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
          <button className="add-customer"><Icon name="plus" size={15}/> Add customer</button>
          <div className="bill-divider"></div>
          <div className="bill-line"><span>Subtotal</span><b>{money(subtotal)}</b></div><div className="bill-line"><span>Discount</span><b>− ₹0</b></div><div className="bill-line"><span>GST included</span><b>{money(subtotal * .12)}</b></div><div className="bill-total"><span>Total</span><strong>{money(subtotal)}</strong></div>
          <label>Payment method<div className="payment-options"><button className="active" type="button">Cash</button><button type="button">UPI</button><button type="button">Card</button></div></label>
          <Button icon="check" disabled={!cart.length} onClick={() => { showToast('Sale completed — invoice INV-1049 created'); setCart([]) }}>Complete sale</Button>
          <Button variant="secondary" icon="print">Save & print invoice</Button>
        </aside>
      </div>
    </>
  )
}

export function Returns() {
  const [type, setType] = useState('All returns')
  const visible = type === 'All returns' ? returns : returns.filter((item) => item.type === type)
  return (
    <><PageHeader title="Returns" description="Manage sale returns, purchase returns and stock impact."><Button icon="plus">Create return</Button></PageHeader><Panel title="Return register"><div className="tabs">{['All returns','Sales return','Purchase return'].map((tab) => <button key={tab} className={type === tab ? 'active' : ''} onClick={() => setType(tab)}>{tab}</button>)}</div><DataTable headers={['Return no.','Type','Customer / Supplier','Against invoice','Date','Reason','Amount','Status']}>
      {visible.map((item) => <tr key={item.id}><td><b className="primary-text">{item.id}</b></td><td>{item.type}</td><td>{item.party}</td><td>{item.invoice}</td><td>{item.date}</td><td>{item.reason}</td><td><b>{money(item.amount)}</b></td><td><Badge tone={item.status === 'Completed' ? 'success' : 'warning'}>{item.status}</Badge></td></tr>)}
    </DataTable></Panel></>
  )
}

export function Reports() {
  return (
    <><PageHeader title="Reports" description="Review sales, purchases, inventory and profitability."><Button variant="secondary" icon="download">Export Excel</Button><Button variant="secondary" icon="download">Export PDF</Button></PageHeader>
      <Panel title="Report filters" className="filter-panel"><div className="report-filters"><label>From<input type="date" defaultValue="2026-09-01"/></label><label>To<input type="date" defaultValue="2026-09-12"/></label><label>Report type<select><option>Sales vs purchase</option><option>Stock valuation</option><option>Expiry report</option><option>Gross profit</option></select></label><Button>Apply filters</Button></div></Panel>
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
  return (
    <>
      <PageHeader title="Medicine Masters" description="Maintain categories, manufacturers and salt/generic names."><Button icon="plus" onClick={() => setAdding(!adding)}>Add {tab === 'Salt / Generic' ? 'salt' : tab.slice(0, -1).toLowerCase()}</Button></PageHeader>
      {adding && <Panel title={`New ${tab === 'Salt / Generic' ? 'salt / generic' : tab.slice(0, -1).toLowerCase()}`} className="inline-form-panel"><form className="master-form" onSubmit={(e) => { e.preventDefault(); setAdding(false); showToast(`${tab} master saved`) }}><label>Name<input required placeholder={`Enter ${tab.toLowerCase()} name`}/></label><label>Description<input placeholder="Optional description"/></label><Button type="submit">Save</Button></form></Panel>}
      <Panel title="Master directory" action={<Badge>{masterData[tab].length} records</Badge>}>
        <div className="tabs">{Object.keys(masterData).map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
        <div className="toolbar"><SearchBox value="" onChange={() => {}} placeholder={`Search ${tab.toLowerCase()}...`}/><Button variant="secondary" icon="download">Export</Button></div>
        <DataTable headers={['Code','Name','Usage','Status','Last updated','']}>
          {masterData[tab].map(([code,name,usage]) => <tr key={code}><td><b className="primary-text">{code}</b></td><td><b>{name}</b></td><td>{usage}</td><td><Badge tone="success">Active</Badge></td><td>12 Sep 2026</td><td><button className="icon-button"><Icon name="edit" size={16}/></button></td></tr>)}
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
  const visible = customers.filter((item) => `${item.name} ${item.phone}`.toLowerCase().includes(search.toLowerCase()))
  return (
    <>
      <PageHeader title="Customers" description="Manage customer details, sales history and credit balances."><Button icon="plus" onClick={() => setAdding(!adding)}>Add customer</Button></PageHeader>
      {adding && <Panel title="New customer" className="inline-form-panel"><form className="inline-form customer-form" onSubmit={(e) => { e.preventDefault(); setAdding(false); showToast('Customer saved successfully') }}><label>Customer name<input required placeholder="Full name"/></label><label>Phone<input required placeholder="+91"/></label><label>Email<input type="email" placeholder="Optional"/></label><label>Credit limit<input type="number" placeholder="₹ 0"/></label><Button type="submit">Save customer</Button></form></Panel>}
      <div className="mini-stats customer-stats"><div><Icon name="users"/><span>Total customers<b>248</b></span></div><div><Icon name="receipt"/><span>Credit outstanding<b className="warning-text">₹18,420</b></span></div><div><Icon name="cart"/><span>Repeat customers<b>64%</b></span></div></div>
      <Panel title="Customer directory"><div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search customer or phone..."/><select><option>All customers</option><option>With credit</option></select></div><DataTable headers={['Customer','Phone','Total visits','Lifetime sales','Credit balance','Last purchase','']}>
        {visible.map((customer) => <tr key={customer.id}><td><b>{customer.name}</b><small>{customer.id}</small></td><td>{customer.phone}</td><td>{customer.visits}</td><td><b>{money(customer.sales)}</b></td><td><b className={customer.credit ? 'warning-text' : ''}>{money(customer.credit)}</b></td><td>{customer.last}</td><td><button className="icon-button"><Icon name="chevron" size={16}/></button></td></tr>)}
      </DataTable></Panel>
    </>
  )
}

export function Login({ onLogin, theme, setTheme }) {
  return (
    <div className="login-page">
      <div className="login-brand"><span className="brand__mark"><Icon name="pill" size={22}/></span><b>MediDesk</b><small>Smart pharmacy operations, simplified.</small></div>
      <div className="login-card">
        <div className="login-heading"><div><span>Welcome back</span><h1>Sign in to your store</h1><p>Enter your credentials to continue to MediDesk.</p></div><button className="icon-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}><Icon name={theme === 'light' ? 'moon' : 'sun'} size={19}/></button></div>
        <form onSubmit={(e) => { e.preventDefault(); onLogin() }}><label>Email or username<input required defaultValue="admin@alimedical.in"/></label><label>Password<input required type="password" defaultValue="password"/></label><div className="login-options"><label><input type="checkbox" defaultChecked/> Remember me</label><button type="button">Forgot password?</button></div><Button type="submit">Sign in</Button></form>
        <p className="demo-note">Demo access is pre-filled — click Sign in to continue.</p>
      </div>
      <footer>© 2026 MediDesk · Secure pharmacy management</footer>
    </div>
  )
}

export function Settings({ theme, setTheme, showToast }) {
  return (
    <><PageHeader title="Settings" description="Configure store, billing, users and application preferences."/><div className="settings-layout"><div className="settings-nav"><button className="active">Store profile</button><button>Invoice & GST</button><button>Users & roles</button><button>Notifications</button><button>Data & backup</button></div><Panel title="Store profile"><form className="settings-form" onSubmit={(e) => { e.preventDefault(); showToast('Settings saved') }}><div className="store-logo"><span><Icon name="store" size={28}/></span><div><b>Ali Medical Store</b><small>Primary business profile</small></div><Button variant="secondary">Change logo</Button></div><div className="form-grid"><label>Business name<input defaultValue="Ali Medical Store"/></label><label>GSTIN<input defaultValue="07ABCDE1234F1Z5"/></label><label>Phone<input defaultValue="+91 98765 43210"/></label><label>Email<input defaultValue="accounts@alimedical.in"/></label><label className="span-2">Address<input defaultValue="Main Market, New Delhi - 110001"/></label></div><div className="preference-row"><div><b>Application theme</b><small>Choose how MediDesk looks on this device.</small></div><div className="theme-choice"><button type="button" className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}><Icon name="sun"/>Light</button><button type="button" className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}><Icon name="moon"/>Dark</button></div></div><div className="form-submit"><Button type="submit">Save changes</Button></div></form></Panel></div></>
  )
}
