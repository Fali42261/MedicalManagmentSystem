import { useEffect, useMemo, useState } from 'react'
import ApiState from './components/ApiState'
import Icon from './components/Icon'
import { PharmacyDataProvider } from './context/PharmacyDataContext'
import { usePharmacyData } from './hooks/usePharmacyData'
import { authApi } from './services/auth.api'
import { Accounts, Compliance, Customers, Dashboard, DataTools, Inventory, Login, Masters, Medicines, Purchases, Reports, Returns, Sales, Schemes, Settings, Stores, Suppliers, UsersRoles } from './features/pages'
import './App.css'

const pageTitles = { dashboard: 'Overview', medicines: 'Medicines', masters: 'Medicine Masters', inventory: 'Inventory', purchases: 'Purchases', sales: 'Sales & Billing', returns: 'Returns', suppliers: 'Suppliers', customers: 'Customers', schemes: 'Schemes & Discounts', accounts: 'Accounts', compliance: 'GST & Compliance', stores: 'Stores', users: 'Users & Roles', reports: 'Reports', 'data-tools': 'Data & Backup', settings: 'Settings' }

function getInitialTheme() {
  const saved = localStorage.getItem('medidesk-theme')
  if (saved) return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function WorkspaceData({ children }) {
  const { loading, error, reload } = usePharmacyData()
  return <ApiState loading={loading} error={error} onRetry={reload}>{children}</ApiState>
}

function NotFound({ navigate, denied = false }) {
  return <div className="not-found"><span>{denied ? '403' : '404'}</span><h1>{denied ? 'Access restricted' : 'Page not found'}</h1><p>{denied ? 'Your current role does not have permission to open this module.' : 'The requested screen does not exist in this application.'}</p><button onClick={() => navigate('dashboard')}>Return to dashboard</button></div>
}

function AppContent() {
  const { reload } = usePharmacyData()
  const [page, setPage] = useState(() => window.location.hash.slice(1) || 'dashboard')
  const [theme, setThemeState] = useState(getInitialTheme)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [globalQuery, setGlobalQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [session, setSession] = useState(authApi.getSession)
  const allowedKeys = useMemo(() => new Set((session?.menu || []).filter(item => item.permissions.includes('View')).map(item => item.key)), [session])
  const navigationGroups = useMemo(() => {
    const groups = new Map()
    ;(session?.menu || []).filter(item => item.key !== 'settings' && item.permissions.includes('View')).forEach(item => {
      if (!groups.has(item.groupName)) groups.set(item.groupName, [])
      groups.get(item.groupName).push(item)
    })
    return [...groups].map(([label, items]) => ({ label, items }))
  }, [session])
  const searchTargets = useMemo(() => (session?.menu || []).filter(item => item.permissions.includes('View')).map(item => ({ key: item.key, label: item.label, description: `Open ${item.label} module` })), [session])

  useEffect(() => {
    const onHashChange = () => setPage(window.location.hash.slice(1) || 'dashboard')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => {
    if (!session?.accessToken) return undefined
    let active = true
    authApi.getNavigation().then(menu => {
      if (!active) return
      setSession(current => current ? authApi.saveSession({ ...current, menu }) : current)
    }).catch(() => {})
    return () => { active = false }
  }, [session?.accessToken])
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
  const authenticate = async (credentials, mode = 'login') => {
    const nextSession = await authApi[mode](credentials)
    setSession(nextSession)
    await reload()
    navigate('dashboard')
  }
  const logout = () => { authApi.clearSession(); setSession(null); navigate('login') }
  const commonProps = { navigate, showToast, theme, setTheme }
  const pages = {
    dashboard: <Dashboard {...commonProps} />,
    medicines: <Medicines {...commonProps} permissions={new Set(session?.menu?.find(item => item.key === 'medicines')?.permissions || [])} />,
    masters: <Masters {...commonProps} permissions={new Set(session?.menu?.find(item => item.key === 'masters')?.permissions || [])} />,
    inventory: <Inventory {...commonProps} permissions={new Set(session?.menu?.find(item => item.key === 'inventory')?.permissions || [])} />,
    purchases: <Purchases {...commonProps} permissions={new Set(session?.menu?.find(item => item.key === 'purchases')?.permissions || [])} />,
    sales: <Sales {...commonProps} />,
    returns: <Returns {...commonProps} />,
    suppliers: <Suppliers {...commonProps} permissions={new Set(session?.menu?.find(item => item.key === 'suppliers')?.permissions || [])} />,
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

  if (!session || page === 'login') return <Login theme={theme} setTheme={setTheme} onLogin={(values) => authenticate(values)} onSignup={(values) => authenticate(values, 'signup')} />

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <button className="brand" onClick={() => navigate('dashboard')}><span className="brand__mark"><Icon name="pill" size={20}/></span><span><b>MediDesk</b><small>Pharmacy ERP</small></span></button>
        <nav>
          {navigationGroups.map((group) => <div className="nav-group" key={group.label}><span className="nav-label">{group.label}</span>{group.items.map((item) => <button key={item.key} className={page === item.key ? 'active' : ''} onClick={() => navigate(item.key)}><Icon name={item.icon} size={19}/><span>{item.label}</span></button>)}</div>)}
        </nav>
        <div className="sidebar-bottom">{allowedKeys.has('settings') && <button className={page === 'settings' ? 'active' : ''} onClick={() => navigate('settings')}><Icon name="settings" size={19}/><span>Settings</span></button>}<div className="sidebar-status"><i></i><span><b>Store online</b><small>Last synced just now</small></span></div></div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Icon name="menu"/></button>
          <div className="breadcrumb"><span>Ali Medical Store</span><b>/</b><strong>{pageTitles[page] || 'Overview'}</strong></div>
          <div className="global-search-wrap"><label className="global-search"><Icon name="search" size={18}/><input value={globalQuery} onChange={(e) => setGlobalQuery(e.target.value)} placeholder="Search modules and records"/><kbd>⌘ K</kbd></label>{globalQuery && <div className="global-results">{searchTargets.filter(item => item.label.toLowerCase().includes(globalQuery.toLowerCase())).map(item => <button key={item.key} onClick={() => { navigate(item.key); setGlobalQuery('') }}><Icon name="search" size={15}/><span><b>{item.label}</b><small>{item.description}</small></span></button>)}{!searchTargets.some(item => item.label.toLowerCase().includes(globalQuery.toLowerCase())) && <p>No matching module found</p>}</div>}</div>
          <div className="topbar-actions"><button className="icon-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Toggle theme"><Icon name={theme === 'light' ? 'moon' : 'sun'} size={19}/></button><div className="notification-wrap"><button className="icon-button notification" aria-label="Notifications" onClick={() => setNotificationsOpen(!notificationsOpen)}><Icon name="bell" size={19}/><i></i></button>{notificationsOpen && <div className="notification-menu"><div><b>Notifications</b><button onClick={() => { setNotificationsOpen(false); showToast('All notifications marked as read') }}>Mark all read</button></div><button onClick={() => { navigate('inventory'); setNotificationsOpen(false) }}><span className="alert-dot"><Icon name="alert" size={14}/></span><span><b>Stock level alerts</b><small>Review reorder levels</small></span></button><button onClick={() => { navigate('inventory'); setNotificationsOpen(false) }}><span className="alert-dot warning"><Icon name="pill" size={14}/></span><span><b>Batch expiry alerts</b><small>Review current inventory</small></span></button></div>}</div><button className="profile" onClick={logout} title="Sign out"><span>{session.user.fullName[0]}</span><div><b>{session.user.fullName}</b><small>{session.user.role}</small></div><span className="profile-chevron">⌄</span></button></div>
        </header>
        <main className="main-content"><WorkspaceData>{pages[page] ? (allowedKeys.has(page) ? pages[page] : <NotFound navigate={navigate} denied/>) : <NotFound navigate={navigate}/>}</WorkspaceData></main>
      </div>
      {toast && <div className="toast"><span><Icon name="check" size={16}/></span>{toast}</div>}
    </div>
  )
}

function App() {
  return <PharmacyDataProvider><AppContent/></PharmacyDataProvider>
}

export default App
