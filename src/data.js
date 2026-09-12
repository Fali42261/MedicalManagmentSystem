export const medicines = [
  { id: 1, name: 'Paracetamol 500mg', generic: 'Paracetamol', category: 'Analgesic', batch: 'PAM001', expiry: 'Dec 2027', stock: 120, minStock: 30, purchase: 1.2, sale: 2.5, rack: 'A-01', status: 'In stock' },
  { id: 2, name: 'Amoxicillin 500mg', generic: 'Amoxicillin', category: 'Antibiotic', batch: 'AMX023', expiry: 'Aug 2027', stock: 45, minStock: 20, purchase: 5.6, sale: 10, rack: 'A-04', status: 'In stock' },
  { id: 3, name: 'Cetirizine 10mg', generic: 'Cetirizine', category: 'Antihistamine', batch: 'CET019', expiry: 'Nov 2026', stock: 8, minStock: 20, purchase: 1.8, sale: 3.5, rack: 'B-02', status: 'Low stock' },
  { id: 4, name: 'Omeprazole 20mg', generic: 'Omeprazole', category: 'Antacid', batch: 'OMP007', expiry: 'Sep 2027', stock: 60, minStock: 20, purchase: 4.2, sale: 8, rack: 'C-03', status: 'In stock' },
  { id: 5, name: 'Azithromycin 500mg', generic: 'Azithromycin', category: 'Antibiotic', batch: 'AZI011', expiry: 'Feb 2027', stock: 32, minStock: 15, purchase: 8, sale: 14, rack: 'A-06', status: 'In stock' },
  { id: 6, name: 'Ibuprofen 400mg', generic: 'Ibuprofen', category: 'Analgesic', batch: 'IBU033', expiry: 'Jul 2027', stock: 15, minStock: 25, purchase: 2.5, sale: 5, rack: 'A-02', status: 'Low stock' },
  { id: 7, name: 'Metformin 500mg', generic: 'Metformin', category: 'Anti-diabetic', batch: 'MET021', expiry: 'Jan 2028', stock: 88, minStock: 30, purchase: 1.3, sale: 2.8, rack: 'D-01', status: 'In stock' },
  { id: 8, name: 'Vitamin D3 60000 IU', generic: 'Cholecalciferol', category: 'Vitamin', batch: 'VIT006', expiry: 'Oct 2026', stock: 4, minStock: 12, purchase: 12, sale: 20, rack: 'E-03', status: 'Expiring' },
]

export const suppliers = [
  { id: 'SUP-001', name: 'Sun Pharma Distributors', contact: 'Rakesh Mehta', phone: '+91 98765 43210', city: 'Delhi', balance: 18450, status: 'Active' },
  { id: 'SUP-002', name: 'Cipla Healthcare Supply', contact: 'Neha Gupta', phone: '+91 98110 22034', city: 'Noida', balance: 8200, status: 'Active' },
  { id: 'SUP-003', name: 'Medline Wholesale', contact: 'Arun Kumar', phone: '+91 99102 88741', city: 'Ghaziabad', balance: 0, status: 'Active' },
  { id: 'SUP-004', name: 'Wellness Pharma Agency', contact: 'Sameer Ali', phone: '+91 98990 44128', city: 'Delhi', balance: 12600, status: 'Active' },
]

export const invoices = [
  { id: 'INV-1048', time: 'Today, 10:24 AM', customer: 'Walk-in customer', items: 3, payment: 'Cash', total: 620, status: 'Paid' },
  { id: 'INV-1047', time: 'Today, 09:17 AM', customer: 'Ramesh Kumar', items: 5, payment: 'UPI', total: 1230, status: 'Paid' },
  { id: 'INV-1046', time: 'Yesterday, 07:42 PM', customer: 'Sunita Sharma', items: 2, payment: 'Card', total: 410, status: 'Paid' },
  { id: 'INV-1045', time: 'Yesterday, 04:15 PM', customer: 'Walk-in customer', items: 4, payment: 'Cash', total: 980, status: 'Paid' },
  { id: 'INV-1044', time: 'Yesterday, 11:03 AM', customer: 'Amit Patel', items: 1, payment: 'UPI', total: 180, status: 'Paid' },
]

export const purchases = [
  { id: 'PUR-2024-0412', supplier: 'Sun Pharma Distributors', date: '12 Sep 2026', items: 18, total: 24580, payment: 'Part paid', status: 'Received' },
  { id: 'PUR-2024-0411', supplier: 'Cipla Healthcare Supply', date: '10 Sep 2026', items: 12, total: 18940, payment: 'Paid', status: 'Received' },
  { id: 'PUR-2024-0410', supplier: 'Medline Wholesale', date: '08 Sep 2026', items: 9, total: 12600, payment: 'Credit', status: 'Received' },
]

export const returns = [
  { id: 'RET-021', type: 'Sales return', party: 'Ramesh Kumar', invoice: 'INV-1019', date: '11 Sep 2026', amount: 280, reason: 'Wrong item', status: 'Completed' },
  { id: 'RET-020', type: 'Purchase return', party: 'Sun Pharma Distributors', invoice: 'PUR-0398', date: '09 Sep 2026', amount: 1460, reason: 'Near expiry', status: 'Completed' },
  { id: 'RET-019', type: 'Purchase return', party: 'Medline Wholesale', invoice: 'PUR-0394', date: '07 Sep 2026', amount: 820, reason: 'Damaged pack', status: 'Pending' },
]

export const salesTrend = [18, 24, 20, 31, 28, 39, 36, 48, 43, 56, 52, 62, 58, 72]

export const reportRows = [
  { name: 'Paracetamol 500mg', sold: 424, sales: 10600, profit: 5512 },
  { name: 'Cetirizine 10mg', sold: 318, sales: 11130, profit: 5406 },
  { name: 'Amoxicillin 500mg', sold: 275, sales: 27500, profit: 12100 },
  { name: 'Ibuprofen 400mg', sold: 190, sales: 9500, profit: 4750 },
  { name: 'Omeprazole 20mg', sold: 162, sales: 12960, profit: 6156 },
]
