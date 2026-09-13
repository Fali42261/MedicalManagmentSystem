import { useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog'
import Icon from '../../components/Icon'
import TablePagination from '../../components/TablePagination'
import { usePharmacyData } from '../../hooks/usePharmacyData'
import { useTableControls } from '../../hooks/useTableControls'
import { money, sortable, valuesFromForm } from './pageUtils'
import { Badge, Button, DataTable, DetailModal, EmptyTable, PageHeader, Panel, SearchBox } from './shared'

export function Suppliers({ showToast }) {
  const { data: { suppliers }, mutations } = usePharmacyData()
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const visible = suppliers.filter((item) => `${item.name} ${item.contact} ${item.city}`.toLowerCase().includes(search.toLowerCase()))
  const table = useTableControls(visible, { pageSize: 5, initialSort: 'name' })
  return (
    <>
      <PageHeader title="Suppliers" description="Manage supplier contacts, purchases and outstanding balances."><Button icon="plus" onClick={() => setAdding(!adding)}>Add supplier</Button></PageHeader>
      {adding && <Panel title="New supplier" className="inline-form-panel"><form className="inline-form" onSubmit={async (e) => { e.preventDefault(); const payload = valuesFromForm(e.currentTarget); try { await mutations.createPartner('supplier', payload); setAdding(false); showToast('Supplier saved successfully') } catch (error) { showToast(error.message) } }}><label>Business name<input name="name" required minLength="2" placeholder="Supplier name"/></label><label>Contact person<input name="contact" required placeholder="Full name"/></label><label>Phone<input name="phone" required pattern="[+0-9 ()-]{10,18}" placeholder="+91"/></label><label>GSTIN<input name="gstin" pattern="[0-9A-Z]{15}" placeholder="GST number"/></label><Button type="submit">Save supplier</Button></form></Panel>}
      <Panel title="Supplier directory" action={<Badge>{visible.length} active</Badge>}>
        <div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search suppliers..."/><Button variant="secondary" icon="download" onClick={() => showToast('Supplier directory exported')}>Export</Button></div>
        <DataTable headers={[sortable('Supplier','name',table),'Contact',sortable('Location','city',table),sortable('Outstanding','balance',table),'Last purchase',sortable('Status','status',table),'']}>
          {table.pageRows.map((supplier) => <tr key={supplier.id}><td><b>{supplier.name}</b><small>{supplier.id}</small></td><td>{supplier.contact}<small>{supplier.phone}</small></td><td>{supplier.city}</td><td><b className={supplier.balance ? 'warning-text' : ''}>{money(supplier.balance)}</b></td><td>API activity</td><td><Badge tone="success">{supplier.status}</Badge></td><td><button className="icon-button" aria-label={`View ${supplier.name}`} onClick={() => setSelected(supplier)}><Icon name="chevron" size={17}/></button></td></tr>)}
          {!table.totalRows && (
            <EmptyTable colSpan={7}/>
          )}
        </DataTable>
        <TablePagination page={table.page} totalPages={table.totalPages} totalRows={table.totalRows} pageSize={5} onPageChange={table.setPage}/>
      </Panel>
      {selected && <DetailModal title={selected.name} description={`${selected.id} · Active supplier`} onClose={() => setSelected(null)} footer={<><Button variant="danger" icon="trash" onClick={() => { setDeleteTarget(selected); setSelected(null) }}>Delete</Button><Button variant="ghost" onClick={() => setSelected(null)}>Close</Button><Button icon="edit" onClick={() => { setSelected(null); setAdding(true) }}>Edit supplier</Button></>}><div className="record-grid"><div><span>Contact person</span><b>{selected.contact}</b></div><div><span>Phone</span><b>{selected.phone}</b></div><div><span>Location</span><b>{selected.city}</b></div><div><span>Outstanding</span><b className="warning-text">{money(selected.balance)}</b></div></div><Panel title="Recent purchase activity"><DataTable headers={['Invoice','Date','Amount','Payment']}><tr><td><b className="primary-text">PUR-2024-0412</b></td><td>API activity</td><td><b>{money(selected.balance)}</b></td><td>Account</td></tr></DataTable></Panel></DetailModal>}
      {deleteTarget && <ConfirmDialog title="Delete supplier?" message={`${deleteTarget.name} will be removed from the supplier directory.`} onCancel={() => setDeleteTarget(null)} onConfirm={async () => { try { await mutations.deletePartner('supplier', deleteTarget.apiId); setDeleteTarget(null); showToast('Supplier deleted successfully') } catch (error) { showToast(error.message) } }}/>} 
    </>
  )
}
export function Customers({ showToast }) {
  const { data: { customers }, mutations } = usePharmacyData()
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const visible = customers.filter((item) => `${item.name} ${item.phone}`.toLowerCase().includes(search.toLowerCase()))
  const table = useTableControls(visible, { pageSize: 5, initialSort: 'name' })
  const outstanding = customers.reduce((sum, item) => sum + item.credit, 0)
  const repeatRate = customers.length ? Math.round(customers.filter(item => item.visits > 5).length / customers.length * 100) : 0
  return (
    <>
      <PageHeader title="Customers" description="Manage customer details, sales history and credit balances."><Button icon="plus" onClick={() => setAdding(!adding)}>Add customer</Button></PageHeader>
      {adding && <Panel title="New customer" className="inline-form-panel"><form className="inline-form customer-form" onSubmit={async (e) => { e.preventDefault(); const payload = valuesFromForm(e.currentTarget); try { await mutations.createPartner('customer', payload); setAdding(false); showToast('Customer saved successfully') } catch (error) { showToast(error.message) } }}><label>Customer name<input name="name" required minLength="2" placeholder="Full name"/></label><label>Phone<input name="phone" required pattern="[+0-9 ()-]{10,18}" placeholder="+91"/></label><label>Email<input name="email" type="email" placeholder="Optional"/></label><label>Credit limit<input name="credit" min="0" type="number" placeholder="₹ 0"/></label><Button type="submit">Save customer</Button></form></Panel>}
      <div className="mini-stats customer-stats"><div><Icon name="users"/><span>Total customers<b>{customers.length}</b></span></div><div><Icon name="receipt"/><span>Credit outstanding<b className="warning-text">{money(outstanding)}</b></span></div><div><Icon name="cart"/><span>Repeat customers<b>{repeatRate}%</b></span></div></div>
      <Panel title="Customer directory"><div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search customer or phone..."/><select><option>All customers</option><option>With credit</option></select></div><DataTable headers={[sortable('Customer','name',table),'Phone',sortable('Total visits','visits',table),sortable('Lifetime sales','sales',table),sortable('Credit balance','credit',table),'Last purchase','']}>
        {table.pageRows.map((customer) => <tr key={customer.id}><td><b>{customer.name}</b><small>{customer.id}</small></td><td>{customer.phone}</td><td>{customer.visits}</td><td><b>{money(customer.sales)}</b></td><td><b className={customer.credit ? 'warning-text' : ''}>{money(customer.credit)}</b></td><td>{customer.last}</td><td><button className="icon-button" aria-label={`View ${customer.name}`} onClick={() => setSelected(customer)}><Icon name="chevron" size={16}/></button></td></tr>)}
        {!table.totalRows && (
          <EmptyTable colSpan={7}/>
        )}
      </DataTable><TablePagination page={table.page} totalPages={table.totalPages} totalRows={table.totalRows} pageSize={5} onPageChange={table.setPage}/></Panel>
      {selected && <DetailModal title={selected.name} description={`${selected.id} · Customer account`} onClose={() => setSelected(null)} footer={<><Button variant="danger" icon="trash" onClick={() => { setDeleteTarget(selected); setSelected(null) }}>Delete</Button><Button variant="ghost" onClick={() => setSelected(null)}>Close</Button><Button onClick={() => { setSelected(null); showToast('Receipt form opened for customer') }}>Record receipt</Button></>}><div className="record-grid"><div><span>Phone</span><b>{selected.phone}</b></div><div><span>Total visits</span><b>{selected.visits}</b></div><div><span>Lifetime sales</span><b>{money(selected.sales)}</b></div><div><span>Credit balance</span><b className={selected.credit ? 'warning-text' : ''}>{money(selected.credit)}</b></div></div><Panel title="Recent activity"><DataTable headers={['Last purchase','Invoices','Account status']}><tr><td>{selected.last}</td><td>{selected.visits}</td><td><Badge tone="success">Active</Badge></td></tr></DataTable></Panel></DetailModal>}
      {deleteTarget && <ConfirmDialog title="Delete customer?" message={`${deleteTarget.name} will be removed from the customer directory.`} onCancel={() => setDeleteTarget(null)} onConfirm={async () => { try { await mutations.deletePartner('customer', deleteTarget.apiId); setDeleteTarget(null); showToast('Customer deleted successfully') } catch (error) { showToast(error.message) } }}/>} 
    </>
  )
}
