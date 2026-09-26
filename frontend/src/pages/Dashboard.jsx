import { useState, useEffect } from 'react'
import { fetchDashboardStats } from '../services/api'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 10000) // update stats every 10s
    return () => clearInterval(interval)
  }, [])

  const loadStats = async () => {
    try {
      const data = await fetchDashboardStats()
      setStats(data)
      setLoading(false)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading || !stats) {
    return (
      <div className="page-card" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <div className="loading-spinner" style={spinnerStyle}></div>
        <span style={{ marginLeft: '12px', color: 'var(--text-muted)' }}>Loading live dashboard metrics...</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ margin: 0 }}>RPMS Dashboard Overview</h2>
        <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Live monitoring of station parking slots, revenue, and active subscriptions.</p>
      </div>

      {/* Casual & Operation Stats */}
      <div className="dashboard-grid">
        <div className="metric-card">
          <span className="metric-title">Currently Parked</span>
          <span className="metric-value" style={{ color: '#6366f1' }}>{stats.currently_parked}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Active sessions inside station</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Today's Entries</span>
          <span className="metric-value">{stats.today_entries}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Vehicles checked-in today</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Today's Exits</span>
          <span className="metric-value">{stats.today_exits}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Vehicles released today</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Today's Revenue</span>
          <span className="metric-value" style={{ color: '#10b981' }}>₹{stats.today_revenue.toFixed(2)}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Casual fees + paid passes</span>
        </div>
      </div>

      {/* Monthly Subscriptions Metrics */}
      <h3 style={{ margin: '8px 0 0 0', color: 'var(--accent-primary)' }}>Monthly Pass Operations</h3>
      <div className="dashboard-grid">
        <div className="metric-card">
          <span className="metric-title">Total Monthly Customers</span>
          <span className="metric-value">{stats.monthly_stats.total_customers}</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Active Passes</span>
          <span className="metric-value" style={{ color: '#10b981' }}>{stats.monthly_stats.active_customers}</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Expired Passes</span>
          <span className="metric-value" style={{ color: '#ef4444' }}>{stats.monthly_stats.expired_customers}</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Pending Payments</span>
          <span className="metric-value" style={{ color: '#f59e0b' }}>{stats.monthly_stats.pending_payments}</span>
        </div>
      </div>

      {/* Financials & Alerts Split Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="page-card" style={{ padding: '24px' }}>
          <h4>Monthly Pass Financial Stats</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-muted)' }}>This Month's Total Revenue (Combined):</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--success)' }}>₹{stats.month_revenue.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-muted)' }}>All-Time Pass Revenue:</span>
            <strong>₹{stats.monthly_stats.pass_revenue.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>UPI / Cash Splits (Today):</span>
            <span>UPI: ₹{stats.payment_stats.upi} | Cash: ₹{stats.payment_stats.cash}</span>
          </div>
        </div>

        <div className="page-card" style={{ padding: '24px', borderColor: stats.expiry_alerts.length > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)' }}>
          <h4 style={{ color: stats.expiry_alerts.length > 0 ? 'var(--danger)' : 'var(--text-main)', margin: '0 0 12px 0' }}>
            ⚠️ Expiry Alerts (Within 5 Days)
          </h4>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {stats.expiry_alerts.length > 0 ? (
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {stats.expiry_alerts.map((alert) => (
                  <li key={alert.id} style={{ marginBottom: '8px' }}>
                    Vehicle <strong style={{ color: 'var(--warning)' }}>{alert.vehicle__vehicle_number}</strong> expires on {alert.expiry_date} (WhatsApp: {alert.whatsapp_number})
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>All subscription memberships are up to date.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const spinnerStyle = {
  width: '24px',
  height: '24px',
  border: '3px solid rgba(255,255,255,0.1)',
  borderTopColor: 'var(--accent-primary)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
}

export default Dashboard
