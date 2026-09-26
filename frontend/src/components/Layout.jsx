import { NavLink } from 'react-router-dom'
import '../styles/Layout.css'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/vehicle-entry', label: 'Vehicle Entry' },
  { to: '/vehicle-release', label: 'Vehicle Exit' },
  { to: '/monthly-pass', label: 'Monthly Pass' },
  { to: '/vehicle-history', label: 'Vehicle History' },
  { to: '/vehicle-search', label: 'Vehicle Search' },
  { to: '/reports', label: 'Reports' },
  { to: '/shift-management', label: 'Shift Management' }
]

function Layout({ children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">🚂</div>
          <h1>Railway Parking</h1>
        </div>
        <nav className="nav-menu">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  )
}

export default Layout
