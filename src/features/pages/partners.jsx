import { useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog'
import Icon from '../../components/Icon'
import TablePagination from '../../components/TablePagination'
import { usePharmacyData } from '../../hooks/usePharmacyData'
import { useTableControls } from '../../hooks/useTableControls'
import { money, sortable, valuesFromForm } from './pageUtils'
import { Badge, Button, DataTable, DetailModal, EmptyTable, PageHeader, Panel, SearchBox } from './shared'

export function Suppliers({ showToast, permissions }) {
  const { data: { suppliers }, mutations } = usePharmacyData()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All status')
  const [formSupplier, setFormSupplier] = useState(null)
  const [selected, setSelected] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const visible = suppliers.filter((item) => `${item.name} ${item.contact} ${item.phone} ${item.gstin} ${item.city}`.toLowerCase().includes(search.toLowerCase()) && (status === 'All status' || item.status === status))
  const table = useTableControls(visible, { pageSize: 5, initialSort: 'name' })
  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    const values = valuesFromForm(event.currentTarget)
    const payload = { ...values, openingBalance: Number(values.openingBalance || 0), isActive: values.isActive !== 'false', rowVersion: formSupplier?.rowVersion }
    try {
      if (formSupplier?.id) await mutations.updateSupplier(formSupplier.id, payload)
      else await mutations.createSupplier(payload)
      setFormSupplier(null)
      showToast(`Supplier ${formSupplier?.id ? 'updated' : 'saved'} successfully`)
    } catch (requestError) { setError(requestError.message) } finally { setSaving(false) }
  }
  return (
    <>
      <PageHeader title="Suppliers" description="Manage supplier identities, compliance details and outstanding balances.">{permissions.has('Add') && <Button icon="plus" onClick={() => { setFormSupplier({}); setError('') }}>Add supplier</Button>}</PageHeader>
      {formSupplier && <Panel title={formSupplier.id ? `Edit ${formSupplier.name}` : 'New supplier'} className="inline-form-panel"><form className="workflow-form workflow-form--wide" onSubmit={submit}><label>Business name<input name="name" required minLength="2" maxLength="160" defaultValue={formSupplier.name} placeholder="Supplier business name"/></label><label>Contact person<input name="contact" required minLength="2" maxLength="120" defaultValue={formSupplier.contact} placeholder="Full name"/></label><label>Phone<input name="phone" required pattern="[+0-9 ()-]{10,18}" defaultValue={formSupplier.phone} placeholder="+91"/></label><label>Email<input name="email" type="email" maxLength="256" defaultValue={formSupplier.email} placeholder="Optional email"/></label><label>GSTIN<input name="gstin" pattern="[0-9A-Za-z]{15}" maxLength="15" defaultValue={formSupplier.gstin} placeholder="15-character GSTIN"/></label><label>Drug licence<input name="drugLicenseNumber" maxLength="80" defaultValue={formSupplier.drugLicenseNumber} placeholder="Optional licence number"/></label><label>City<input name="city" required minLength="2" maxLength="100" defaultValue={formSupplier.city} placeholder="City"/></label><label>State<input name="state" required minLength="2" maxLength="100" defaultValue={formSupplier.state} placeholder="State"/></label><label>PIN code<input name="postalCode" pattern="[0-9]{6}" defaultValue={formSupplier.postalCode} placeholder="6 digits"/></label><label className="span-2">Address<input name="address" maxLength="300" defaultValue={formSupplier.address} placeholder="Business address"/></label>{formSupplier.id ? <label>Status<select name="isActive" defaultValue={String(formSupplier.isActive)}><option value="true">Active</option><option value="false">Inactive</option></select></label> : <label>Opening balance<input name="openingBalance" type="number" min="0" step="0.01" defaultValue="0" placeholder="₹ 0"/></label>}<div className="row-actions"><Button variant="ghost" onClick={() => setFormSupplier(null)} disabled={saving}>Cancel</Button><Button type="submit" icon="check" disabled={saving}>{saving ? 'Saving…' : 'Save supplier'}</Button></div>{error && <p className="form-error span-2" role="alert">{error}</p>}</form></Panel>}
      <Panel title="Supplier directory" action={<Badge>{visible.length} records</Badge>}>
        <div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search name, contact, phone, GSTIN or city..."/><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All status</option><option>Active</option><option>Inactive</option></select><Button variant="secondary" icon="download" onClick={() => showToast('Supplier directory exported')}>Export</Button></div>
        <DataTable headers={[sortable('Supplier','name',table),'Contact',sortable('Location','city',table),sortable('Outstanding','balance',table),'Updated',sortable('Status','status',table),'']}>
          {table.pageRows.map((supplier) => <tr key={supplier.id}><td><b>{supplier.name}</b><small>{supplier.code}</small></td><td>{supplier.contact}<small>{supplier.phone}</small></td><td>{supplier.city}<small>{supplier.state}</small></td><td><b className={supplier.balance ? 'warning-text' : ''}>{money(supplier.balance)}</b></td><td>{new Date(supplier.updatedAtUtc).toLocaleDateString('en-IN')}</td><td><Badge tone={supplier.isActive ? 'success' : 'neutral'}>{supplier.status}</Badge></td><td><div className="row-actions"><button className="icon-button" aria-label={`View ${supplier.name}`} onClick={() => setSelected(supplier)}><Icon name="chevron" size={17}/></button>{permissions.has('Edit') && <button className="icon-button" aria-label={`Edit ${supplier.name}`} onClick={() => { setFormSupplier(supplier); setError('') }}><Icon name="edit" size={16}/></button>}{permissions.has('Delete') && <button className="icon-button danger-text" aria-label={`Delete ${supplier.name}`} onClick={() => setDeleteTarget(supplier)}><Icon name="trash" size={16}/></button>}</div></td></tr>)}
          {!table.totalRows && (
            <EmptyTable colSpan={7}/>
          )}
        </DataTable>
        <TablePagination page={table.page} totalPages={table.totalPages} totalRows={table.totalRows} pageSize={5} onPageChange={table.setPage}/>
      </Panel>
      {selected && <DetailModal title={selected.name} description={`${selected.code} · ${selected.status} supplier`} onClose={() => setSelected(null)} footer={<><Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>{permissions.has('Delete') && <Button variant="danger" icon="trash" onClick={() => { setDeleteTarget(selected); setSelected(null) }}>Delete</Button>}{permissions.has('Edit') && <Button icon="edit" onClick={() => { setFormSupplier(selected); setSelected(null); setError('') }}>Edit supplier</Button>}</>}><div className="record-grid"><div><span>Contact person</span><b>{selected.contact}</b></div><div><span>Phone</span><b>{selected.phone}</b></div><div><span>Email</span><b>{selected.email || '—'}</b></div><div><span>GSTIN</span><b>{selected.gstin || '—'}</b></div><div><span>Drug licence</span><b>{selected.drugLicenseNumber || '—'}</b></div><div><span>Location</span><b>{[selected.city, selected.state, selected.postalCode].filter(Boolean).join(', ')}</b></div><div><span>Address</span><b>{selected.address || '—'}</b></div><div><span>Outstanding</span><b className={selected.balance ? 'warning-text' : ''}>{money(selected.balance)}</b></div><div><span>Last updated</span><b>{new Date(selected.updatedAtUtc).toLocaleDateString('en-IN')}</b></div></div></DetailModal>}
      {deleteTarget && (
        <ConfirmDialog title="Delete supplier?" message={`${deleteTarget.name} will be soft deleted and hidden from the supplier directory.`} busy={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={async () => { setDeleting(true); try { await mutations.deleteSupplier(deleteTarget.id); setDeleteTarget(null); showToast('Supplier deleted successfully') } catch (requestError) { showToast(requestError.message) } finally { setDeleting(false) } }}/>
      )}
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
