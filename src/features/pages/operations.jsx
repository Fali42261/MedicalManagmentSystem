import { useMemo, useState } from 'react'
import Icon from '../../components/Icon'
import TablePagination from '../../components/TablePagination'
import { usePharmacyData } from '../../hooks/usePharmacyData'
import { useTableControls } from '../../hooks/useTableControls'
import { money, sortable, valuesFromForm } from './pageUtils'
import { Badge, Button, DataTable, DetailModal, EmptyTable, PageHeader, Panel, SearchBox } from './shared'

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100

export function Purchases({ showToast, permissions }) {
  const { data: { medicines, purchases, suppliers }, mutations } = usePharmacyData()
  const [create, setCreate] = useState(false)
  const [selected, setSelected] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('All payments')
  const [paymentMethod, setPaymentMethod] = useState('Credit')
  const [amountPaid, setAmountPaid] = useState(0)
  const [lines, setLines] = useState([])
  const [saving, setSaving] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const activeSuppliers = suppliers.filter(supplier => supplier.isActive)
  const subtotal = lines.reduce((sum, item) => sum + item.rate * item.quantity, 0)
  const discountTotal = lines.reduce((sum, item) => sum + item.discountAmount, 0)
  const taxTotal = lines.reduce((sum, item) => sum + roundMoney(Math.max(0, item.rate * item.quantity - item.discountAmount) * Number(item.gst || 0) / 100), 0)
  const grandTotal = roundMoney(subtotal - discountTotal + taxTotal)
  const purchaseVisible = purchases.filter(purchase => `${purchase.code} ${purchase.supplier} ${purchase.supplierInvoiceNumber}`.toLowerCase().includes(search.toLowerCase()) && (paymentFilter === 'All payments' || purchase.payment === paymentFilter))
  const table = useTableControls(purchaseVisible, { pageSize: 5, initialSort: 'date' })
  const addLine = () => {
    const medicine = medicines.find(item => !lines.some(line => line.medicineId === item.id))
    if (!medicine) return showToast('All available medicine batches are already added')
    setLines(rows => [...rows, { key: `${medicine.id}-${Date.now()}`, medicineId: medicine.id, name: medicine.name, batch: medicine.batch, expiry: medicine.expiry, rate: Number(medicine.purchase), gst: Number(medicine.gst || 0), quantity: 1, discountAmount: 0 }])
  }
  const updateLine = (key, changes) => setLines(rows => rows.map(line => line.key === key ? { ...line, ...changes } : line))
  const selectMedicine = (key, medicineId) => {
    const medicine = medicines.find(item => item.id === Number(medicineId))
    if (medicine) updateLine(key, { medicineId: medicine.id, name: medicine.name, batch: medicine.batch, expiry: medicine.expiry, rate: Number(medicine.purchase), gst: Number(medicine.gst || 0) })
  }
  const openDetails = async (purchase) => {
    try { setSelected(await mutations.getPurchase(purchase.id)) } catch (requestError) { showToast(requestError.message) }
  }
  return (
    <>
      <PageHeader title="Purchases" description="Record supplier invoices and receive stock batch-wise.">{permissions.has('Add') && <Button icon="plus" onClick={() => { setCreate(!create); setLines([]); setError(''); setAmountPaid(0); setPaymentMethod('Credit') }}>New purchase</Button>}</PageHeader>
      {create ? <Panel title="Create purchase invoice" action={<button className="text-button" onClick={() => setCreate(false)}>Back to purchases</button>}>
        <form onSubmit={async (event) => { event.preventDefault(); setError(''); setSaving(true); const values = valuesFromForm(event.currentTarget); const payload = { supplierId: Number(values.supplierId), supplierInvoiceNumber: values.supplierInvoiceNumber, invoiceDate: values.invoiceDate, paymentMethod, amountPaid: paymentMethod === 'Credit' ? 0 : Number(amountPaid), notes: values.notes || null, items: lines.map(line => ({ medicineId: line.medicineId, quantity: line.quantity, rate: line.rate, discountAmount: line.discountAmount })) }; try { await mutations.createPurchase(payload); setCreate(false); setLines([]); showToast('Purchase received and stock updated successfully') } catch (requestError) { setError(requestError.message) } finally { setSaving(false) } }}>
          <div className="document-fields"><label>Supplier<select name="supplierId" required defaultValue=""><option value="" disabled>Select active supplier</option>{activeSuppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label><label>Supplier invoice<input name="supplierInvoiceNumber" required maxLength="80" placeholder="Supplier invoice no."/></label><label>Invoice date<input name="invoiceDate" required type="date" max={new Date().toISOString().slice(0, 10)} defaultValue={new Date().toISOString().slice(0, 10)}/></label><label>Payment method<select value={paymentMethod} onChange={(event) => { setPaymentMethod(event.target.value); if (event.target.value === 'Credit') setAmountPaid(0) }}><option>Credit</option><option>Cash</option><option>Bank</option><option>UPI</option></select></label></div>
          <DataTable headers={['Medicine / Batch','Expiry','Qty','Rate','Discount','GST','Amount','']}>
            {lines.map((item) => { const taxable = Math.max(0, item.rate * item.quantity - item.discountAmount); const lineTotal = roundMoney(taxable + roundMoney(taxable * item.gst / 100)); return <tr key={item.key}><td><select className="table-input" value={item.medicineId} onChange={(event) => selectMedicine(item.key, event.target.value)}>{medicines.filter(medicine => medicine.id === item.medicineId || !lines.some(line => line.medicineId === medicine.id)).map(medicine => <option key={medicine.id} value={medicine.id}>{medicine.name} · {medicine.batch}</option>)}</select><small>{item.batch}</small></td><td>{item.expiry}</td><td><input aria-label={`${item.name} quantity`} className="table-input table-input--small" min="1" type="number" value={item.quantity} onChange={(event) => updateLine(item.key, { quantity: Math.max(1, Number(event.target.value)) })}/></td><td><input aria-label={`${item.name} rate`} className="table-input table-input--small" min="0" step="0.01" type="number" value={item.rate} onChange={(event) => updateLine(item.key, { rate: Math.max(0, Number(event.target.value)) })}/></td><td><input aria-label={`${item.name} discount`} className="table-input table-input--small" min="0" max={item.rate * item.quantity} step="0.01" type="number" value={item.discountAmount} onChange={(event) => updateLine(item.key, { discountAmount: Math.max(0, Number(event.target.value)) })}/></td><td>{item.gst}%</td><td><b>{money(lineTotal)}</b></td><td><button type="button" className="icon-button danger-text" aria-label={`Remove ${item.name}`} onClick={() => setLines(rows => rows.filter(row => row.key !== item.key))}><Icon name="trash" size={16}/></button></td></tr> })}
            {!lines.length && <EmptyTable colSpan={8} message="Add at least one medicine batch."/>}
          </DataTable>
          <div className="document-footer"><div><Button variant="secondary" icon="plus" onClick={addLine}>Add item</Button>{!activeSuppliers.length && <p className="form-error">Create an active supplier before recording a purchase.</p>}{error && <p className="form-error" role="alert">{error}</p>}</div><div className="totals"><span>Subtotal<b>{money(subtotal)}</b></span><span>Discount<b>− {money(discountTotal)}</b></span><span>GST<b>{money(taxTotal)}</b></span><strong>Total amount<b>{money(grandTotal)}</b></strong>{paymentMethod !== 'Credit' && <label>Amount paid<input min="0" max={grandTotal} step="0.01" type="number" value={amountPaid} onChange={(event) => setAmountPaid(Math.max(0, Number(event.target.value)))}/></label>}<label>Notes<input name="notes" maxLength="500" placeholder="Optional notes"/></label><Button type="submit" icon="check" disabled={saving || !lines.length || !activeSuppliers.length || amountPaid > grandTotal}>{saving ? 'Receiving…' : 'Receive purchase'}</Button></div></div>
        </form>
      </Panel> : <Panel title="Purchase history"><div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search purchase, supplier or supplier invoice..."/><select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}><option>All payments</option><option>Paid</option><option>Part paid</option><option>Credit</option></select></div><DataTable headers={['Purchase no.',sortable('Supplier','supplier',table),sortable('Date','date',table),sortable('Items','items',table),'Payment',sortable('Total','total',table),'Status','']}>
        {table.pageRows.map((purchase) => <tr key={purchase.id}><td><b className="primary-text">{purchase.code}</b><small>{purchase.supplierInvoiceNumber}</small></td><td>{purchase.supplier}</td><td>{new Date(`${purchase.date}T00:00:00`).toLocaleDateString('en-IN')}</td><td>{purchase.items}</td><td>{purchase.payment}<small>{purchase.paymentMethod}</small></td><td><b>{money(purchase.total)}</b><small>{purchase.amountDue ? `${money(purchase.amountDue)} due` : 'Fully paid'}</small></td><td><Badge tone="success">{purchase.status}</Badge></td><td><div className="row-actions"><button className="icon-button" aria-label={`View ${purchase.code}`} onClick={() => openDetails(purchase)}><Icon name="chevron" size={17}/></button>{permissions.has('Delete') && <button className="icon-button danger-text" aria-label={`Cancel ${purchase.code}`} onClick={() => setCancelTarget(purchase)}><Icon name="trash" size={16}/></button>}</div></td></tr>)}
        {!table.totalRows && (
          <EmptyTable colSpan={8}/>
        )}
      </DataTable><TablePagination page={table.page} totalPages={table.totalPages} totalRows={table.totalRows} pageSize={5} onPageChange={table.setPage}/></Panel>}
      {selected && <DetailModal title={selected.code} description={`Supplier invoice ${selected.supplierInvoiceNumber}`} onClose={() => setSelected(null)} footer={<><Button variant="ghost" onClick={() => setSelected(null)}>Close</Button><Button icon="print" onClick={() => showToast('Purchase invoice sent to printer')}>Print invoice</Button></>}><div className="record-grid"><div><span>Supplier</span><b>{selected.supplier}</b></div><div><span>Invoice date</span><b>{new Date(`${selected.date}T00:00:00`).toLocaleDateString('en-IN')}</b></div><div><span>Payment</span><b>{selected.payment} · {selected.paymentMethod}</b></div><div><span>Subtotal</span><b>{money(selected.subtotal)}</b></div><div><span>Tax / Discount</span><b>{money(selected.taxTotal)} / {money(selected.discountTotal)}</b></div><div><span>Total / Due</span><b>{money(selected.total)} / {money(selected.amountDue)}</b></div></div><Panel title="Received medicine batches"><DataTable headers={['Medicine','Batch','Expiry','Qty','Rate','GST','Total']}>{selected.lines.map(line => <tr key={line.id}><td><b>{line.medicineName}</b></td><td>{line.batchNumber}</td><td>{new Date(`${line.expiryDate}T00:00:00`).toLocaleDateString('en-IN')}</td><td>{line.quantity}</td><td>{money(line.rate)}</td><td>{line.gstRate}%</td><td><b>{money(line.lineTotal)}</b></td></tr>)}</DataTable></Panel></DetailModal>}
      {cancelTarget && <div className="modal-backdrop"><section className="confirm-dialog" role="alertdialog" aria-modal="true"><span><Icon name="alert" size={22}/></span><div><h2>Cancel purchase?</h2><p>{cancelTarget.code} will be soft deleted. Received stock and supplier outstanding will be reversed transactionally. Cancellation is blocked if stock has already been consumed.</p></div><div><button type="button" onClick={() => setCancelTarget(null)} disabled={cancelling}>Keep purchase</button><button type="button" className="danger-action" disabled={cancelling} onClick={async () => { setCancelling(true); try { await mutations.cancelPurchase(cancelTarget.id); setCancelTarget(null); showToast('Purchase cancelled and stock reversed') } catch (requestError) { showToast(requestError.message) } finally { setCancelling(false) } }}>{cancelling ? 'Cancelling…' : 'Cancel purchase'}</button></div></section></div>}
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
