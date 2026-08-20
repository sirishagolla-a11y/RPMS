import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import '../styles/App.css';

export default function Dashboard({ currentShift }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    // Run daily reminders silently on load to update expired status/logs
    apiService.triggerDailyReminders().catch(err => console.error('Reminders check failed:', err));
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await apiService.getDashboardStats();
      setStats(data);
      setError('');
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Could not connect to backend server. Make sure Django server is running.');
    } finally {
      setLoading(false);
    }
  };

  const isShiftOpen = currentShift?.active;

  return (
    <div className="animate-fade-in" style={{ padding: '1rem' }}>
      {/* Top Banner / Operator status */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(19, 28, 49, 0.9))', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '0.25rem', fontFamily: 'var(--font-heading)' }}>
              Railway Parking Control Center
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Operator: <strong style={{ color: 'var(--text-primary)' }}>{isShiftOpen ? currentShift.shift.operator_name : 'No Shift Active'}</strong> |
              Shift Date: <strong>{isShiftOpen ? currentShift.shift.shift_date : 'Offline'}</strong>
            </p>
          </div>
          <button className="btn btn-secondary" onClick={fetchDashboardData}>🔄 Refresh Data</button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Quick Action Navigation Grid */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={() => navigate('/entry')} style={{ padding: '1rem', fontSize: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📥</span>
            <span>Park Vehicle</span>
          </button>
          <button className="btn btn-success" onClick={() => navigate('/release')} style={{ padding: '1rem', fontSize: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📤</span>
            <span>Release Vehicle</span>
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/shift')} style={{ padding: '1rem', fontSize: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderColor: 'var(--accent-info)' }}>
            <span style={{ fontSize: '1.5rem' }}>🎫</span>
            <span>Monthly Pass</span>
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/history')} style={{ padding: '1rem', fontSize: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📜</span>
            <span>Vehicle History</span>
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/reports')} style={{ padding: '1rem', fontSize: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📈</span>
            <span>Reports</span>
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/search')} style={{ padding: '1rem', fontSize: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🔍</span>
            <span>Settings / Search</span>
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading statistics...</p>
      ) : stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Top Cards: Core Parking Metrics */}
          <div>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Core Parking Metrics</h3>
            <div className="dashboard-grid">
              <div className="card stat-card warning">
                <div className="stat-header">Currently Parked</div>
                <div className="stat-value">{stats.current_inside}</div>
                <div className="stat-footer">Vehicles inside lot</div>
              </div>
              <div className="card stat-card success">
                <div className="stat-header">Today's Entries</div>
                <div className="stat-value">{stats.today_entries}</div>
                <div className="stat-footer">Checked in today</div>
              </div>
              <div className="card stat-card danger">
                <div className="stat-header">Today's Exits</div>
                <div className="stat-value">{stats.today_exits}</div>
                <div className="stat-footer">Released today</div>
              </div>
              <div className="card stat-card info">
                <div className="stat-header">Today's Revenue</div>
                <div className="stat-value">₹{stats.today_revenue.total.toFixed(2)}</div>
                <div className="stat-footer">Combined Cash & UPI today</div>
              </div>
              <div className="card stat-card">
                <div className="stat-header">Monthly Revenue</div>
                <div className="stat-value">₹{stats.current_month_revenue.toFixed(2)}</div>
                <div className="stat-footer">Collection this month</div>
              </div>
            </div>
          </div>

          {/* Alerts & Critical Notifications */}
          <div>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Alerts & Tasks</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div className="card" style={{ borderLeft: '4px solid var(--accent-danger)', background: 'rgba(239, 68, 68, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: 'var(--accent-danger)' }}>Expired Monthly Passes</h4>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.25rem 0' }}>{stats.expired_passes}</p>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate('/search')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>View</button>
              </div>

              <div className="card" style={{ borderLeft: '4px solid var(--accent-warning)', background: 'rgba(245, 158, 11, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: 'var(--accent-warning)' }}>Expiring Soon (&lt; 5 days)</h4>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.25rem 0' }}>{stats.expiring_soon}</p>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate('/search')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Check</button>
              </div>

              <div className="card" style={{ borderLeft: '4px solid var(--accent-info)', background: 'rgba(6, 182, 212, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: 'var(--accent-info)' }}>Today's Reminders Sent</h4>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.25rem 0' }}>{stats.today_reminder_count}</p>
                </div>
                <span style={{ fontSize: '1.5rem' }}>📱</span>
              </div>
            </div>
          </div>

          {/* Monthly Subscription Section */}
          <div className="card">
            <h3 className="section-title" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              Monthly Subscription Section
            </h3>
            <div className="dashboard-grid" style={{ marginTop: '1rem' }}>
              <div className="card" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Total Monthly Customers</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.25rem 0' }}>{stats.total_monthly_customers}</div>
              </div>
              <div className="card" style={{ backgroundColor: 'var(--bg-tertiary)', borderLeft: '3px solid var(--accent-success)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Active Monthly Pass</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.25rem 0', color: 'var(--accent-success)' }}>{stats.active_monthly_customers}</div>
              </div>
              <div className="card" style={{ backgroundColor: 'var(--bg-tertiary)', borderLeft: '3px solid var(--accent-danger)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Expired Monthly Pass</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.25rem 0', color: 'var(--accent-danger)' }}>{stats.expired_monthly_customers}</div>
              </div>
              <div className="card" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Pending Payments</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.25rem 0', color: 'var(--accent-warning)' }}>{stats.pending_payments}</div>
              </div>
              <div className="card" style={{ backgroundColor: 'var(--bg-tertiary)', borderLeft: '3px solid var(--accent-primary)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Monthly Pass Collection</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.25rem 0' }}>₹{stats.monthly_revenue.toFixed(2)}</div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
