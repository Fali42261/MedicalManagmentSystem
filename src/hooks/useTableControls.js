import { useMemo, useState } from 'react'

const readValue = (row, key) => typeof key === 'function' ? key(row) : row[key]

export function useTableControls(rows, { pageSize = 6, initialSort = null } = {}) {
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState(initialSort ? { key: initialSort, direction: 'asc' } : null)

  const sortedRows = useMemo(() => {
    if (!sort) return rows
    return [...rows].sort((left, right) => {
      const a = readValue(left, sort.key)
      const b = readValue(right, sort.key)
      const result = typeof a === 'number' && typeof b === 'number' ? a - b : String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true })
      return sort.direction === 'asc' ? result : -result
    })
  }, [rows, sort])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize)
  const toggleSort = (key) => { setPage(1); setSort(current => current?.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }) }

  return { pageRows, page: safePage, setPage, totalPages, totalRows: sortedRows.length, sort, toggleSort }
}
