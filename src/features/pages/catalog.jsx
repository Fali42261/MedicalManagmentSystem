import { useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog'
import Icon from '../../components/Icon'
import TablePagination from '../../components/TablePagination'
import { usePharmacyData } from '../../hooks/usePharmacyData'
import { useTableControls } from '../../hooks/useTableControls'
import { money, sortable } from './pageUtils'
import { Badge, Button, DataTable, EmptyTable, MedicineModal, PageHeader, Panel, SalesChart, SearchBox } from './shared'

export function Dashboard({ navigate }) {
  const { data: { invoices, medicines } } = usePharmacyData()
  const totalSales = invoices.reduce((sum, item) => sum + item.total, 0)
  const totalStock = medicines.reduce((sum, item) => sum + item.stock, 0)
  const lowStock = medicines.filter(item => item.stock <= item.minStock).length
  const expiring = medicines.filter(item => item.status === 'Expiring').length
  return (
    <>
      <PageHeader title="Overview" description="Here’s how your medical store is performing today.">
        <Button variant="secondary" icon="plus" onClick={() => navigate('medicines')}>Add medicine</Button>
        <Button icon="cart" onClick={() => navigate('sales')}>Create sale</Button>
      </PageHeader>
      <div className="stats-grid">
        <div className="stat-card stat-card--wide">
          <div className="stat-card__top"><div><span>Current sales</span><strong>{money(totalSales)}</strong></div><Badge tone="success">API live</Badge></div>
          <div className="stat-card__meta"><span>{invoices.length} loaded invoices</span><span>{medicines.length} catalogue items</span></div>
          <SalesChart compact />
        </div>
        <div className="stat-card"><span>Current stock</span><strong>{totalStock.toLocaleString('en-IN')}</strong><p><b className="positive">API</b> catalogue units</p><div className="stat-icon stat-icon--indigo"><Icon name="box" /></div></div>
        <div className="stat-card"><span>Low stock</span><strong>{lowStock}</strong><p>Needs reordering</p><div className="stat-icon stat-icon--danger"><Icon name="alert" /></div></div>
        <div className="stat-card"><span>Expiring soon</span><strong>{expiring}</strong><p>Mapped expiry alerts</p><div className="stat-icon stat-icon--warning"><Icon name="pill" /></div></div>
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
export function Medicines({ showToast }) {
  const { data: { medicines }, mutations } = usePharmacyData()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All status')
  const [showModal, setShowModal] = useState(false)
  const [editMedicine, setEditMedicine] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const visible = medicines.filter((item) => `${item.name} ${item.generic} ${item.batch}`.toLowerCase().includes(search.toLowerCase()) && (status === 'All status' || item.status === status))
  const table = useTableControls(visible, { pageSize: 6, initialSort: 'name' })
  return (
    <>
      <PageHeader title="Medicines" description="Manage medicine master, batches, pricing and tax information."><Button icon="plus" onClick={() => setShowModal(true)}>Add medicine</Button></PageHeader>
      <Panel title="Medicine master" action={<Badge>{visible.length} medicines</Badge>}>
        <div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search medicine, generic name or batch..."/><select value={status} onChange={(e) => setStatus(e.target.value)}><option>All status</option><option>In stock</option><option>Low stock</option><option>Expiring</option></select><Button variant="secondary" icon="filter" onClick={() => showToast('Medicine filters applied')}>Filters</Button></div>
        <DataTable headers={[sortable('Medicine','name',table),sortable('Category','category',table),'Batch / Expiry',sortable('Stock','stock',table),'Purchase',sortable('Sale','sale',table),'Rack',sortable('Status','status',table),'']}>
          {table.pageRows.map((item) => <tr key={item.id}><td><div className="medicine-cell"><span><Icon name="pill" size={17}/></span><div><b>{item.name}</b><small>{item.generic}</small></div></div></td><td>{item.category}</td><td><b>{item.batch}</b><small>{item.expiry}</small></td><td><b className={item.stock < item.minStock ? 'danger-text' : ''}>{item.stock}</b><small>Min. {item.minStock}</small></td><td>{money(item.purchase)}</td><td><b>{money(item.sale)}</b></td><td>{item.rack}</td><td><Badge tone={item.status === 'In stock' ? 'success' : item.status === 'Expiring' ? 'warning' : 'danger'}>{item.status}</Badge></td><td><div className="row-actions"><button className="icon-button" aria-label={`Edit ${item.name}`} onClick={() => setEditMedicine(item)}><Icon name="edit" size={17}/></button><button className="icon-button danger-text" aria-label={`Delete ${item.name}`} onClick={() => setDeleteTarget(item)}><Icon name="trash" size={16}/></button></div></td></tr>)}
          {!table.totalRows && (
            <EmptyTable colSpan={9}/>
          )}
        </DataTable>
        <TablePagination page={table.page} totalPages={table.totalPages} totalRows={table.totalRows} pageSize={6} onPageChange={table.setPage}/>
      </Panel>
      {showModal && <MedicineModal
        onClose={() => setShowModal(false)}
        onSave={async (payload) => { await mutations.createMedicine(payload); setShowModal(false); showToast('Medicine saved successfully') }}
      />}
      {editMedicine && <MedicineModal
        item={editMedicine}
        onClose={() => setEditMedicine(null)}
        onSave={async (payload) => { await mutations.updateMedicine(editMedicine.id, payload); setEditMedicine(null); showToast('Medicine updated successfully') }}
      />}
      {deleteTarget && <ConfirmDialog
        title="Delete medicine?"
        message={`${deleteTarget.name} will be removed from the current medicine register.`}
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => { setDeleting(true); try { await mutations.deleteMedicine(deleteTarget.id); setDeleteTarget(null); showToast('Medicine deleted successfully') } catch (error) { showToast(error.message) } finally { setDeleting(false) } }}
      />}
    </>
  )
}
export function Inventory({ showToast }) {
  const { data: { medicines } } = usePharmacyData()
  const [view, setView] = useState('All stock')
  const [adjusting, setAdjusting] = useState(false)
  const filtered = view === 'All stock' ? medicines : medicines.filter((item) => view === 'Low stock' ? item.stock < item.minStock : item.status === 'Expiring')
  const stockValue = medicines.reduce((sum, item) => sum + item.stock * item.purchase, 0)
  const totalUnits = medicines.reduce((sum, item) => sum + item.stock, 0)
  const lowStock = medicines.filter(item => item.stock < item.minStock).length
  const nearExpiry = medicines.filter(item => item.status === 'Expiring').length
  return (
    <>
      <PageHeader title="Inventory" description="Track batch-wise stock, expiry and reorder levels."><Button variant="secondary" icon="download" onClick={() => showToast('Stock register exported')}>Export stock</Button><Button icon="edit" onClick={() => setAdjusting(!adjusting)}>Stock adjustment</Button></PageHeader>
      {adjusting && <Panel title="Record stock adjustment" className="inline-form-panel"><form className="workflow-form" onSubmit={(e) => { e.preventDefault(); setAdjusting(false); showToast('Stock adjustment recorded') }}><label>Medicine<select>{medicines.map((item) => <option key={item.id}>{item.name} · {item.batch}</option>)}</select></label><label>Adjustment<select><option>Add stock</option><option>Remove stock</option><option>Opening correction</option></select></label><label>Quantity<input required min="1" type="number" placeholder="0"/></label><label>Reason<input required placeholder="Damage, count correction..."/></label><Button type="submit" icon="check">Save adjustment</Button></form></Panel>}
      <div className="mini-stats"><div><Icon name="box"/><span>Stock value<b>{money(stockValue)}</b></span></div><div><Icon name="pill"/><span>Total units<b>{totalUnits.toLocaleString('en-IN')}</b></span></div><div><Icon name="alert"/><span>Low stock<b className="danger-text">{lowStock}</b></span></div><div><Icon name="return"/><span>Near expiry<b className="warning-text">{nearExpiry}</b></span></div></div>
      <Panel title="Stock register">
        <div className="tabs">{['All stock','Low stock','Near expiry'].map((tab) => <button className={view === tab ? 'active' : ''} onClick={() => setView(tab)} key={tab}>{tab}</button>)}</div>
        <DataTable headers={['Medicine','Batch','Expiry','Rack','Available','Min. level','Stock value','Health']}>
          {filtered.map((item) => { const health = Math.min(100, Math.round((item.stock / Math.max(item.minStock * 3, 1)) * 100)); return <tr key={item.id}><td><b>{item.name}</b><small>{item.generic}</small></td><td>{item.batch}</td><td>{item.expiry}</td><td>{item.rack}</td><td><b>{item.stock}</b></td><td>{item.minStock}</td><td>{money(item.stock * item.purchase)}</td><td><div className="health-cell"><span><i style={{width:`${health}%`}}></i></span><small>{health}%</small></div></td></tr> })}
        </DataTable>
      </Panel>
    </>
  )
}
export function Masters({ showToast }) {
  const { data: { masterData } } = usePharmacyData()
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
          {masterData[tab].filter(row => row.join(' ').toLowerCase().includes(search.toLowerCase())).map(([code,name,usage]) => <tr key={code}><td><b className="primary-text">{code}</b></td><td><b>{name}</b></td><td>{usage}</td><td><Badge tone="success">Active</Badge></td><td>12 Sep 2026</td><td><button className="icon-button" aria-label={`Edit ${name}`} onClick={() => { setAdding(false); setEditing([code,name,usage]) }}><Icon name="edit" size={16}/></button></td></tr>)}
        </DataTable>
      </Panel>
    </>
  )
}
