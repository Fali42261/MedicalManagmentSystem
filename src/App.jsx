import { useEffect, useState } from 'react'
import Icon from './components/Icon'
import { Accounts, Compliance, Customers, Dashboard, DataTools, Inventory, Login, Masters, Medicines, Purchases, Reports, Returns, Sales, Schemes, Settings, Stores, Suppliers, UsersRoles } from './pages'
import './App.css'

const navGroups = [
  { label: 'Workspace', items: [['dashboard', 'Overview', 'dashboard'], ['pill', 'Medicines', 'medicines'], ['box', 'Medicine Masters', 'masters'], ['box', 'Inventory', 'inventory']] },
  { label: 'Operations', items: [['receipt', 'Purchases', 'purchases'], ['cart', 'Sales & Billing', 'sales'], ['return', 'Returns', 'returns']] },
  { label: 'Partners', items: [['truck', 'Suppliers', 'suppliers'], ['users', 'Customers', 'customers']] },
  { label: 'Finance', items: [['receipt', 'Schemes & Discounts', 'schemes'], ['chart', 'Accounts', 'accounts'], ['check', 'GST & Compliance', 'compliance']] },
  { label: 'Management', items: [['store', 'Stores', 'stores'], ['users', 'Users & Roles', 'users'], ['chart', 'Reports', 'reports']] },
  { label: 'System', items: [['download', 'Data & Backup', 'data-tools']] },
]

const pageTitles = { dashboard: 'Overview', medicines: 'Medicines', masters: 'Medicine Masters', inventory: 'Inventory', purchases: 'Purchases', sales: 'Sales & Billing', returns: 'Returns', suppliers: 'Suppliers', customers: 'Customers', schemes: 'Schemes & Discounts', accounts: 'Accounts', compliance: 'GST & Compliance', stores: 'Stores', users: 'Users & Roles', reports: 'Reports', 'data-tools': 'Data & Backup', settings: 'Settings' }

function getInitialTheme() {
  const saved = localStorage.getItem('medidesk-theme')
  if (saved) return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function App() {
  const [page, setPage] = useState(() => window.location.hash.slice(1) || 'dashboard')
  const [theme, setThemeState] = useState(getInitialTheme)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const onHashChange = () => setPage(window.location.hash.slice(1) || 'dashboard')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const setTheme = (nextTheme) => {
    setThemeState(nextTheme)
    localStorage.setItem('medidesk-theme', nextTheme)
  }

  const navigate = (nextPage) => {
    window.location.hash = nextPage
    setPage(nextPage)
    setSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const showToast = (message) => setToast(message)
  const commonProps = { navigate, showToast, theme, setTheme }
  const pages = {
    dashboard: <Dashboard {...commonProps} />,
    medicines: <Medicines {...commonProps} />,
    masters: <Masters {...commonProps} />,
    inventory: <Inventory {...commonProps} />,
    purchases: <Purchases {...commonProps} />,
    sales: <Sales {...commonProps} />,
    returns: <Returns {...commonProps} />,
    suppliers: <Suppliers {...commonProps} />,
    customers: <Customers {...commonProps} />,
    schemes: <Schemes {...commonProps} />,
    accounts: <Accounts {...commonProps} />,
    compliance: <Compliance {...commonProps} />,
    stores: <Stores {...commonProps} />,
    users: <UsersRoles {...commonProps} />,
    reports: <Reports {...commonProps} />,
    'data-tools': <DataTools {...commonProps} />,
    settings: <Settings {...commonProps} />,
  }

  if (page === 'login') return <Login theme={theme} setTheme={setTheme} onLogin={() => navigate('dashboard')} />

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <button className="brand" onClick={() => navigate('dashboard')}><span className="brand__mark"><Icon name="pill" size={20}/></span><span><b>MediDesk</b><small>Pharmacy ERP</small></span></button>
        <nav>
          {navGroups.map((group) => <div className="nav-group" key={group.label}><span className="nav-label">{group.label}</span>{group.items.map(([icon,label,key]) => <button key={key} className={page === key ? 'active' : ''} onClick={() => navigate(key)}><Icon name={icon} size={19}/><span>{label}</span></button>)}</div>)}
        </nav>
        <div className="sidebar-bottom"><button className={page === 'settings' ? 'active' : ''} onClick={() => navigate('settings')}><Icon name="settings" size={19}/><span>Settings</span></button><div className="sidebar-status"><i></i><span><b>Store online</b><small>Last synced just now</small></span></div></div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setSidebarOpen(true)}><Icon name="menu"/></button>
          <div className="breadcrumb"><span>Ali Medical Store</span><b>/</b><strong>{pageTitles[page] || 'Overview'}</strong></div>
          <label className="global-search"><Icon name="search" size={18}/><input placeholder="Search medicines, invoices or suppliers"/><kbd>⌘ K</kbd></label>
          <div className="topbar-actions"><button className="icon-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Toggle theme"><Icon name={theme === 'light' ? 'moon' : 'sun'} size={19}/></button><button className="icon-button notification" aria-label="Notifications"><Icon name="bell" size={19}/><i></i></button><button className="profile" onClick={() => navigate('login')} title="Open sign-in screen"><span>A</span><div><b>Ali</b><small>Administrator</small></div><span className="profile-chevron">⌄</span></button></div>
        </header>
        <main className="main-content">{pages[page] || pages.dashboard}</main>
      </div>
      {toast && <div className="toast"><span><Icon name="check" size={16}/></span>{toast}</div>}
    </div>
  )
}

export default App
