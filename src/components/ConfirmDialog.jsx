import Icon from './Icon'

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', busy = false, onCancel, onConfirm }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"><span><Icon name="alert" size={22}/></span><div><h2 id="confirm-title">{title}</h2><p>{message}</p></div><div><button type="button" onClick={onCancel} disabled={busy}>Cancel</button><button type="button" className="danger-action" onClick={onConfirm} disabled={busy}>{busy ? 'Please wait…' : confirmLabel}</button></div></section></div>
}
