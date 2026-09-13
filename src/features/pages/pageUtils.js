export const money = (value) => `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
export const valuesFromForm = (form) => Object.fromEntries(new FormData(form).entries())
export const sortable = (label, key, controls) => ({ label, onSort: () => controls.toggleSort(key), active: controls.sort?.key === key, direction: controls.sort?.direction })
