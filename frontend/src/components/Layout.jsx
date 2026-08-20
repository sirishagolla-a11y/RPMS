import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import '../styles/Layout.css';

export default function Layout({ children, currentShift, onRefreshShift }) {
  const isShiftOpen = currentShift?.active;
  const operatorName = currentShift?.shift?.operator_name || 'N/A';
  const shiftDate = currentShift?.shift?.shift_date || '';

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="logo-section">
          <div className="logo-icon">P</div>
          <div className="logo-text">
            <h1>RailPark</h1>
            <p>Parking System</p>
          </div>
        </div>

        <nav className="nav-links" style={{ flexGrow: 1 }}>
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            Dashboard
          </NavLink>

          <NavLink to="/shift" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Shift Management
          </NavLink>

          <NavLink to="/entry" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            Vehicle Entry
          </NavLink>

          <NavLink to="/release" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            Vehicle Release
          </NavLink>

          <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Search Active
          </NavLink>

          <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            Parking History
          </NavLink>

          <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Reports & Stats
          </NavLink>

          <NavLink to="/monthly-pass" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M8 2v4" />
              <path d="M16 2v4" />
              <path d="M3 10h18" />
            </svg>
            Monthly Pass
          </NavLink>
        </nav>

        {/* Shift Summary Box */}
        <div className="shift-indicator-box" style={{ marginTop: 'auto' }}>
          <h4>SHIFT STATUS</h4>
          {isShiftOpen ? (
            <>
              <span className="shift-status-badge open">Active</span>
              <div className="shift-operator-name" title={operatorName}>{operatorName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{shiftDate}</div>
            </>
          ) : (
            <>
              <span className="shift-status-badge closed">Closed</span>
              <div className="shift-operator-name">System Offline</div>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="top-header">
          <div className="header-title">
            <h2>Railway Parking Management</h2>
          </div>
          <div className="header-stats">
            <div>Operator: <span>{isShiftOpen ? operatorName : 'None'}</span></div>
            <div>Status: <span style={{ color: isShiftOpen ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{isShiftOpen ? 'ONLINE' : 'OFFLINE'}</span></div>
          </div>
        </header>

        <main className="content-body">
          {(!isShiftOpen && window.location.pathname !== '/shift') && (
            <div className="alert-banner animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span><strong>Shift Closed!</strong> You must open a shift before you can record parking entries or releases.</span>
              </div>
              <Link to="/shift" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Go Open Shift</Link>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
