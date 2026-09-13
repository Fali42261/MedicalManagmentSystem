export default function TablePagination({ page, totalPages, totalRows, pageSize, onPageChange }) {
  if (!totalRows) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalRows)
  return <div className="pagination"><span>Showing {start}–{end} of {totalRows}</span><div><button disabled={page === 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">‹</button>{Array.from({ length: totalPages }, (_, index) => index + 1).map(number => <button key={number} className={page === number ? 'active' : ''} onClick={() => onPageChange(number)} aria-label={`Page ${number}`}>{number}</button>)}<button disabled={page === totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">›</button></div></div>
}
