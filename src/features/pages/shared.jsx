import { useState } from 'react'
import Icon from '../../components/Icon'
import { usePharmacyData } from '../../hooks/usePharmacyData'

export function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function PageHeader({ title, description, children }) {
  return (
    <div className="page-header">
      <div><h1>{title}</h1><p>{description}</p></div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  )
}

export function Button({ children, variant = 'primary', icon, onClick, type = 'button', disabled = false }) {
  return <button className={`button button--${variant}`} onClick={onClick} type={type} disabled={disabled}>{icon && <Icon name={icon} size={17} />}{children}</button>
}

export function SearchBox({ value, onChange, placeholder = 'Search...' }) {
  return <label className="search-box"><Icon name="search" size={17} /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>
}

export function Panel({ title, action, children, className = '' }) {
  return <section className={`panel ${className}`}><div className="panel__header"><h2>{title}</h2>{action}</div>{children}</section>
}

export function DataTable({ headers, children, className = '' }) {
  return <div className={`table-wrap ${className}`}><table><thead><tr>{headers.map((header) => { const config = typeof header === 'string' ? { label: header } : header; return <th key={config.label} aria-sort={config.active ? (config.direction === 'asc' ? 'ascending' : 'descending') : undefined}>{config.onSort ? <button className="sort-button" onClick={config.onSort}>{config.label}<span>{config.active ? (config.direction === 'asc' ? '↑' : '↓') : '↕'}</span></button> : config.label}</th> })}</tr></thead><tbody>{children}</tbody></table></div>
}

export function EmptyTable({ colSpan, message = 'No matching records found.' }) {
  return <tr className="empty-row"><td colSpan={colSpan}><Icon name="search" size={20}/><b>{message}</b><small>Change the filters or create a new record.</small></td></tr>
}

export function DetailModal({ title, description, onClose, children, footer }) {
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="modal detail-modal" role="dialog" aria-modal="true" aria-label={title}><div className="modal__header"><div><h2>{title}</h2><p>{description}</p></div><button className="icon-button" type="button" aria-label="Close dialog" onClick={onClose}><Icon name="close"/></button></div><div className="detail-modal__body">{children}</div>{footer && <div className="modal__footer">{footer}</div>}</section></div>
}

export function SalesChart({ compact = false }) {
  const { data: { salesTrend } } = usePharmacyData()
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

export function MedicineModal({ item, onClose, onSave }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    const values = valuesFromForm(event.currentTarget)
    const payload = { ...values, purchase: Number(values.purchase), sale: Number(values.sale), stock: Number(values.stock), minStock: Number(values.minStock || 0) }
    if (payload.sale < payload.purchase) return setError('Sale price cannot be lower than purchase price.')
    setBusy(true)
    try { await onSave(payload) } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" role="dialog" aria-modal="true" aria-label={item ? 'Edit medicine' : 'Add medicine'} onSubmit={submit}>
        <div className="modal__header"><div><h2>{item ? 'Edit medicine' : 'Add medicine'}</h2><p>{item ? 'Update medicine, pricing and reorder information.' : 'Create a medicine with batch, pricing and stock details.'}</p></div><button className="icon-button" type="button" aria-label="Close medicine form" onClick={onClose}><Icon name="close" /></button></div>
        <div className="form-section"><h3>Medicine details</h3><div className="form-grid"><label>Medicine name<input name="name" required defaultValue={item?.name} placeholder="e.g. Paracetamol 500mg" /></label><label>Generic name<input name="generic" required defaultValue={item?.generic} placeholder="e.g. Paracetamol" /></label><label>Category<select name="category" defaultValue={item?.category || 'Analgesic'}><option>Analgesic</option><option>Antibiotic</option><option>Vitamin</option><option>Antacid</option><option>Anti-diabetic</option></select></label><label>Manufacturer<input name="manufacturer" placeholder="Manufacturer name" /></label><label>Dosage form<select name="dosageForm"><option>Tablet</option><option>Capsule</option><option>Syrup</option><option>Injection</option></select></label><label>Strength<input name="strength" placeholder="500mg" /></label></div></div>
        <div className="form-section"><h3>Batch, pricing and stock</h3><div className="form-grid"><label>Batch number<input name="batch" required defaultValue={item?.batch} placeholder="Batch no." /></label><label>Expiry date<input name="expiry" required type="month" /></label><label>Purchase price<input name="purchase" required min="0" type="number" step="0.01" defaultValue={item?.purchase} placeholder="₹ 0.00" /></label><label>Sale price<input name="sale" required min="0" type="number" step="0.01" defaultValue={item?.sale} placeholder="₹ 0.00" /></label><label>Opening stock<input name="stock" required min="0" type="number" defaultValue={item?.stock} placeholder="0" /></label><label>Minimum stock<input name="minStock" min="0" type="number" defaultValue={item?.minStock} placeholder="10" /></label><label>GST rate<select name="gst"><option>5%</option><option>12%</option><option>18%</option></select></label><label>Rack number<input name="rack" defaultValue={item?.rack} placeholder="e.g. A-01" /></label></div>{error && <p className="form-error" role="alert">{error}</p>}</div>
        <div className="modal__footer"><Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" icon="check" disabled={busy}>{busy ? 'Saving…' : item ? 'Update medicine' : 'Save medicine'}</Button></div>
      </form>
    </div>
  )
}
