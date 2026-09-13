import { useMemo, useState } from 'react'
import Icon from '../../components/Icon'
import TablePagination from '../../components/TablePagination'
import { usePharmacyData } from '../../hooks/usePharmacyData'
import { useTableControls } from '../../hooks/useTableControls'
import { money, sortable, valuesFromForm } from './pageUtils'
import { Badge, Button, DataTable, DetailModal, EmptyTable, PageHeader, Panel, SearchBox } from './shared'

export function Purchases({ showToast }) {
  const { data: { medicines, purchases }, mutations } = usePharmacyData()
  const [create, setCreate] = useState(false)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [lines, setLines] = useState(medicines.slice(0, 3).map((item, index) => ({ ...item, qty: [100, 50, 30][index] })))
  const subtotal = lines.reduce((sum, item) => sum + item.purchase * item.qty, 0)
  const purchaseVisible = purchases.filter(purchase => `${purchase.id} ${purchase.supplier}`.toLowerCase().includes(search.toLowerCase()))
  const table = useTableControls(purchaseVisible, { pageSize: 5, initialSort: 'date' })
  return (
    <>
      <PageHeader title="Purchases" description="Record supplier invoices and receive stock batch-wise."><Button icon="plus" onClick={() => setCreate(!create)}>New purchase</Button></PageHeader>
      {create ? <Panel title="Create purchase invoice" action={<button className="text-button" onClick={() => setCreate(false)}>Back to purchases</button>}>
        <form onSubmit={async (e) => { e.preventDefault(); const values = valuesFromForm(e.currentTarget); const record = { id: `PUR-${Date.now()}`, supplier: values.supplier, date: values.date, items: lines.length, total: subtotal * 1.12, payment: values.payment, status: 'Received' }; try { await mutations.createTransaction('purchases', { apiPayload: { userId: 1, products: lines.map(item => ({ id: item.id, quantity: item.qty })) }, record }); setCreate(false); showToast('Purchase recorded successfully') } catch (error) { showToast(error.message) } }}>
          <div className="document-fields"><label>Supplier<select name="supplier"><option>Sun Pharma Distributors</option><option>Cipla Healthcare Supply</option></select></label><label>Supplier invoice<input name="supplierInvoice" required defaultValue="SPD-2026-0912"/></label><label>Invoice date<input name="date" required type="date" defaultValue="2026-09-12"/></label><label>Payment<select name="payment"><option>Credit</option><option>Cash</option><option>Bank</option></select></label></div>
          <DataTable headers={['Medicine','Batch','Expiry','Qty','Rate','GST','Amount','']}>
            {lines.map((item) => <tr key={item.id}><td><b>{item.name}</b></td><td><input className="table-input" defaultValue={item.batch}/></td><td><input className="table-input" defaultValue={item.expiry}/></td><td><input className="table-input table-input--small" type="number" value={item.qty} onChange={(e) => setLines(rows => rows.map(row => row.id === item.id ? {...row, qty: Math.max(1, Number(e.target.value))} : row))}/></td><td><input className="table-input table-input--small" type="number" value={item.purchase} onChange={(e) => setLines(rows => rows.map(row => row.id === item.id ? {...row, purchase: Math.max(0, Number(e.target.value))} : row))}/></td><td>12%</td><td><b>{money(item.purchase * item.qty)}</b></td><td><button type="button" className="icon-button danger-text" aria-label={`Remove ${item.name}`} onClick={() => setLines(rows => rows.filter(row => row.id !== item.id))}><Icon name="trash" size={16}/></button></td></tr>)}
          </DataTable>
          <div className="document-footer"><Button variant="secondary" icon="plus" onClick={() => { const next = medicines.find(item => !lines.some(row => row.id === item.id)); if (next) setLines(rows => [...rows, {...next, qty: 1}]); else showToast('All available medicines are already added') }}>Add item</Button><div className="totals"><span>Subtotal<b>{money(subtotal)}</b></span><span>GST (12%)<b>{money(subtotal * .12)}</b></span><strong>Total amount<b>{money(subtotal * 1.12)}</b></strong><Button type="submit" icon="check" disabled={!lines.length}>Save purchase</Button></div></div>
        </form>
      </Panel> : <Panel title="Purchase history"><div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search invoice or supplier..."/><select><option>All payments</option><option>Paid</option><option>Credit</option></select></div><DataTable headers={['Purchase no.',sortable('Supplier','supplier',table),sortable('Date','date',table),sortable('Items','items',table),'Payment',sortable('Total','total',table),'Status','']}>
        {table.pageRows.map((purchase) => <tr key={purchase.id}><td><b className="primary-text">{purchase.id}</b></td><td>{purchase.supplier}</td><td>{purchase.date}</td><td>{purchase.items}</td><td>{purchase.payment}</td><td><b>{money(purchase.total)}</b></td><td><Badge tone="success">{purchase.status}</Badge></td><td><button className="icon-button" aria-label={`View ${purchase.id}`} onClick={() => setSelected(purchase)}><Icon name="chevron" size={17}/></button></td></tr>)}
        {!table.totalRows && (
          <EmptyTable colSpan={8}/>
        )}
      </DataTable><TablePagination page={table.page} totalPages={table.totalPages} totalRows={table.totalRows} pageSize={5} onPageChange={table.setPage}/></Panel>}
      {selected && <DetailModal title={selected.id} description="Purchase invoice details" onClose={() => setSelected(null)} footer={<><Button variant="ghost" onClick={() => setSelected(null)}>Close</Button><Button icon="print" onClick={() => showToast('Purchase invoice sent to printer')}>Print invoice</Button></>}><div className="record-grid"><div><span>Supplier</span><b>{selected.supplier}</b></div><div><span>Invoice date</span><b>{selected.date}</b></div><div><span>Items</span><b>{selected.items}</b></div><div><span>Total</span><b>{money(selected.total)}</b></div><div><span>Payment</span><b>{selected.payment}</b></div><div><span>Status</span><Badge tone="success">{selected.status}</Badge></div></div></DetailModal>}
    </>
  )
}
export function Sales({ showToast }) {
  const { data: { medicines, invoices }, mutations } = usePharmacyData()
  const [cart, setCart] = useState([{...medicines[0], qty: 2}, {...medicines[2], qty: 1}])
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState(false)
  const [payment, setPayment] = useState('Cash')
  const [addingCustomer, setAddingCustomer] = useState(false)
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const subtotal = cart.reduce((sum, item) => sum + item.sale * item.qty, 0)
  const updateQty = (id, amount) => setCart((items) => items.map((item) => item.id === id ? {...item, qty: Math.max(1, item.qty + amount)} : item))
  const addItem = (item) => setCart((items) => items.some((row) => row.id === item.id) ? items.map((row) => row.id === item.id ? {...row, qty: row.qty + 1} : row) : [...items, {...item, qty: 1}])
  const suggestions = useMemo(() => medicines.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5), [query, medicines])
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
            {cart.map((item) => <tr key={item.id}><td><b>{item.name}</b><small>{item.generic}</small></td><td>{item.batch}</td><td>{item.expiry}</td><td><div className="qty-control"><button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => updateQty(item.id,-1)}>−</button><span>{item.qty}</span><button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => updateQty(item.id,1)}>+</button></div></td><td>{money(item.sale)}</td><td>12%</td><td><b>{money(item.sale * item.qty)}</b></td><td><button className="icon-button danger-text" aria-label={`Remove ${item.name}`} onClick={() => setCart((items) => items.filter((row) => row.id !== item.id))}><Icon name="trash" size={16}/></button></td></tr>)}
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
          <Button icon="check" disabled={!cart.length} onClick={async () => { const record = { id: `INV-${Date.now()}`, time: 'Just now', customer: 'Walk-in customer', items: cart.length, payment, total: subtotal, status: 'Paid' }; try { await mutations.createTransaction('invoices', { apiPayload: { userId: 1, products: cart.map(item => ({ id: item.id, quantity: item.qty })) }, record }); showToast(`Sale completed by ${payment}`); setCart([]) } catch (error) { showToast(error.message) } }}>Complete sale</Button>
          <Button variant="secondary" icon="print" disabled={!cart.length} onClick={() => showToast('Invoice saved and sent to printer')}>Save & print invoice</Button>
        </aside>
      </div>}
    </>
  )
}
export function Returns({ showToast }) {
  const { data: { returns }, mutations } = usePharmacyData()
  const [type, setType] = useState('All returns')
  const [creating, setCreating] = useState(false)
  const visible = type === 'All returns' ? returns : returns.filter((item) => item.type === type)
  return (
    <><PageHeader title="Returns" description="Manage sale returns, purchase returns and stock impact."><Button icon="plus" onClick={() => setCreating(!creating)}>Create return</Button></PageHeader>{creating && <Panel title="Create return voucher" className="inline-form-panel"><form className="workflow-form workflow-form--wide" onSubmit={async (e) => { e.preventDefault(); const values = valuesFromForm(e.currentTarget); const record = { id: `RET-${Date.now()}`, type: values.type, party: values.party, invoice: values.invoice, date: new Date().toLocaleDateString('en-IN'), reason: values.reason, amount: Number(values.amount), status: 'Completed' }; try { await mutations.createTransaction('returns', { apiPayload: { userId: 1, products: [{ id: 1, quantity: 1 }] }, record }); setCreating(false); showToast('Return voucher saved successfully') } catch (error) { showToast(error.message) } }}><label>Return type<select name="type"><option>Sales return</option><option>Purchase return</option></select></label><label>Against invoice<input name="invoice" required placeholder="INV-1048"/></label><label>Customer / supplier<input name="party" required placeholder="Party name"/></label><label>Reason<select name="reason"><option>Damaged</option><option>Wrong item</option><option>Expired</option><option>Customer request</option></select></label><label>Amount<input name="amount" required min="1" type="number" placeholder="₹ 0"/></label><Button type="submit" icon="check">Save return</Button></form></Panel>}<Panel title="Return register"><div className="tabs">{['All returns','Sales return','Purchase return'].map((tab) => <button key={tab} className={type === tab ? 'active' : ''} onClick={() => setType(tab)}>{tab}</button>)}</div><DataTable headers={['Return no.','Type','Customer / Supplier','Against invoice','Date','Reason','Amount','Status']}>
      {visible.map((item) => <tr key={item.id}><td><b className="primary-text">{item.id}</b></td><td>{item.type}</td><td>{item.party}</td><td>{item.invoice}</td><td>{item.date}</td><td>{item.reason}</td><td><b>{money(item.amount)}</b></td><td><Badge tone={item.status === 'Completed' ? 'success' : 'warning'}>{item.status}</Badge></td></tr>)}
    </DataTable></Panel></>
  )
}
