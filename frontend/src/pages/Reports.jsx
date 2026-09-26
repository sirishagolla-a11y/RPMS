import { useState, useEffect } from 'react'
import { fetchReports } from '../services/api'

function Reports() {
  const [period, setPeriod] = useState('today')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reportsData, setReportsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    loadReports()
  }, [period])

  const loadReports = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const data = await fetchReports(period, startDate, endDate)
      setReportsData(data)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load report metrics')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomSearch = (e) => {
    e.preventDefault()
    if (period === 'custom') {
      loadReports()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header & Controls */}
      <div className="page-card" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Operational & Revenue Reports</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>Detailed analytics, capacity utilization, payment breakdowns, and shift logs.</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '10px 16px' }}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="today">Today's Report</option>
            <option value="7days">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {period === 'custom' && (
            <form onSubmit={handleCustomSearch} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="date"
                required
                className="form-input"
                style={{ width: 'auto', padding: '8px 12px' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span style={{ color: 'var(--text-muted)' }}>to</span>
              <input
                type="date"
                required
                className="form-input"
                style={{ width: 'auto', padding: '8px 12px' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Filter
              </button>
            </form>
          )}

          <button className="btn-secondary" style={{ padding: '10px 18px' }} onClick={loadReports} disabled={loading}>
            🔄 {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="btn-secondary" style={{ padding: '10px 18px' }} onClick={() => window.print()}>
            🖨️ Print Report
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '16px', borderRadius: '12px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', fontWeight: '600' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {loading || !reportsData ? (
        <div className="page-card" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading real-time report metrics from database...</p>
        </div>
      ) : (
        <>
          {/* Key Summary KPIs */}
          <div className="dashboard-grid">
            <div className="metric-card">
              <span className="metric-title">Total Entries ({reportsData.period.toUpperCase()})</span>
              <span className="metric-value">{reportsData.summary.total_entries}</span>
              <span style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>Check-ins recorded</span>
            </div>
            <div className="metric-card">
              <span className="metric-title">Total Exits</span>
              <span className="metric-value">{reportsData.summary.total_exits}</span>
              <span style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>Releases completed</span>
            </div>
            <div className="metric-card">
              <span className="metric-title">Currently Occupied</span>
              <span className="metric-value" style={{ color: 'var(--accent-primary)' }}>{reportsData.summary.current_parked}</span>
              <span style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>Vehicles inside stand</span>
            </div>
            <div className="metric-card">
              <span className="metric-title">Period Revenue</span>
              <span className="metric-value" style={{ color: 'var(--success)' }}>₹{reportsData.summary.total_revenue.toFixed(2)}</span>
              <span style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>Casual fees + pass payments</span>
            </div>
          </div>

          {/* Utilization & Capacity Bar */}
          <div className="page-card">
            <h3 style={{ margin: '0 0 16px 0' }}>🅿️ Parking Capacity & Utilization</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Total Capacity:</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>{reportsData.utilization.total_capacity} Slots</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Occupied Spaces:</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-primary)' }}>{reportsData.utilization.current_occupied} Vehicles</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Available Spaces:</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--success)' }}>{reportsData.utilization.available_spaces} Slots</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Occupancy Rate:</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: reportsData.utilization.occupancy_percentage > 85 ? 'var(--danger)' : 'var(--success)' }}>
                  {reportsData.utilization.occupancy_percentage}%
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ height: '14px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, reportsData.utilization.occupancy_percentage)}%`,
                background: reportsData.utilization.occupancy_percentage > 85 ? 'var(--danger)' : 'var(--accent-gradient)',
                borderRadius: '10px',
                transition: 'width 0.4s ease'
              }}></div>
            </div>
          </div>

          {/* Revenue Breakdown & Vehicle Breakdown Side-by-Side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Revenue by Payment Type */}
            <div className="page-card">
              <h3 style={{ margin: '0 0 16px 0' }}>💳 Payment Type & Revenue Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span>💵 Cash Payments ({reportsData.payment_breakdown.cash.count} Exits)</span>
                  <strong style={{ color: 'var(--success)' }}>₹{reportsData.payment_breakdown.cash.revenue.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span>📱 UPI Digital Payments ({reportsData.payment_breakdown.upi.count} Exits)</span>
                  <strong style={{ color: 'var(--info)' }}>₹{reportsData.payment_breakdown.upi.revenue.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span>🎟️ Monthly Subscriber Visits ({reportsData.payment_breakdown.monthly_free.count} Free Entries)</span>
                  <strong style={{ color: 'var(--accent-primary)' }}>₹0.00 (Pass Covered)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #86efac' }}>
                  <span>📅 Monthly Pass Renewals Revenue</span>
                  <strong style={{ color: '#15803d' }}>₹{reportsData.payment_breakdown.monthly_pass_revenue.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            {/* Vehicle Type Distribution */}
            <div className="page-card">
              <h3 style={{ margin: '0 0 16px 0' }}>🚗 Vehicle Category Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Car / SUV</span>
                    <strong>{reportsData.vehicle_breakdown.car} vehicles</strong>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '6px' }}>
                    <div style={{
                      height: '100%',
                      width: `${reportsData.summary.total_entries > 0 ? (reportsData.vehicle_breakdown.car / reportsData.summary.total_entries) * 100 : 0}%`,
                      background: '#4f46e5',
                      borderRadius: '6px'
                    }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Bike / Two Wheeler</span>
                    <strong>{reportsData.vehicle_breakdown.bike} vehicles</strong>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '6px' }}>
                    <div style={{
                      height: '100%',
                      width: `${reportsData.summary.total_entries > 0 ? (reportsData.vehicle_breakdown.bike / reportsData.summary.total_entries) * 100 : 0}%`,
                      background: '#10b981',
                      borderRadius: '6px'
                    }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Truck / Bus / Heavy Vehicle</span>
                    <strong>{reportsData.vehicle_breakdown.truck} vehicles</strong>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '6px' }}>
                    <div style={{
                      height: '100%',
                      width: `${reportsData.summary.total_entries > 0 ? (reportsData.vehicle_breakdown.truck / reportsData.summary.total_entries) * 100 : 0}%`,
                      background: '#f59e0b',
                      borderRadius: '6px'
                    }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Trends Visualization Bar Chart */}
          <div className="page-card">
            <h3 style={{ margin: '0 0 16px 0' }}>📈 Daily Traffic & Revenue Trends</h3>
            {reportsData.daily_trends.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '180px', paddingTop: '20px', overflowX: 'auto' }}>
                {reportsData.daily_trends.map((item, idx) => {
                  const maxEntries = Math.max(1, ...reportsData.daily_trends.map(t => t.entries))
                  const barHeight = Math.max(10, (item.entries / maxEntries) * 140)
                  return (
                    <div key={idx} style={{ flex: '1', minWidth: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-primary)' }}>{item.entries}</span>
                      <div style={{ width: '100%', height: `${barHeight}px`, background: 'var(--accent-gradient)', borderRadius: '6px 6px 0 0' }}></div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{item.date}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0' }}>No daily trend data available for selected filter.</p>
            )}
          </div>

          {/* Shift Report Section */}
          <div className="page-card">
            <h3 style={{ margin: '0 0 16px 0' }}>⏱️ Operator Duty Shift Reports</h3>
            {reportsData.shift_report.active_shift ? (
              <div style={{ padding: '16px', borderRadius: '12px', background: '#f0fdf4', border: '1.5px solid #86efac', marginBottom: '20px' }}>
                <span className="status-badge active">CURRENT OPEN SHIFT</span>
                <h4 style={{ margin: '8px 0 4px 0', color: '#14532d' }}>Operator: {reportsData.shift_report.active_shift.operator_name}</h4>
                <p style={{ margin: 0, color: '#166534', fontSize: '0.9rem' }}>
                  Started: {new Date(reportsData.shift_report.active_shift.start_time).toLocaleString()}
                </p>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>No active shift open currently.</p>
            )}

            <h4 style={{ margin: '0 0 12px 0' }}>Recent Shift Handovers</h4>
            <div className="premium-table-wrapper">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Shift ID</th>
                    <th>Operator Name</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Entries</th>
                    <th>Exits</th>
                    <th>Revenue Handover</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsData.shift_report.recent_shifts.length > 0 ? (
                    reportsData.shift_report.recent_shifts.map((s) => (
                      <tr key={s.id}>
                        <td>#{s.id}</td>
                        <td style={{ fontWeight: 'bold' }}>{s.operator_name}</td>
                        <td>{new Date(s.start_time).toLocaleTimeString()}</td>
                        <td>{s.end_time ? new Date(s.end_time).toLocaleTimeString() : 'N/A'}</td>
                        <td>{s.total_entries}</td>
                        <td>{s.total_exits}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>₹{s.total_revenue}</td>
                        <td>
                          <span className={`status-badge ${s.status === 'OPEN' ? 'active' : 'expired'}`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No shift records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Reports
