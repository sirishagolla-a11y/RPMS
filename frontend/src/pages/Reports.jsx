import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import '../styles/App.css';
import '../styles/report-print.css';

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await apiService.getDashboardStats();
      setStats(data);
      setError('');
    } catch (err) {
      console.error('Failed to load reports data:', err);
      setError('Could not fetch report metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)' }}>Reports & Analytics</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Financial summary and vehicle movement reports</p>
        </div>

        <button className="btn btn-secondary" onClick={handlePrintReport}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print Formal Report
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Loading report metrics...</p>
      ) : stats && (
        <div>
          <div className="dashboard-grid">
            <div className="card stat-card success">
              <div className="stat-header">
                <span>Today's Revenue</span>
                <span className="stat-icon">💰</span>
              </div>
              <div className="stat-value">₹{stats.today_revenue?.total?.toFixed(2)}</div>
              <div className="stat-footer">Total payments collected today</div>
            </div>

            <div className="card stat-card info">
              <div className="stat-header">
                <span>Cash Collection</span>
                <span className="stat-icon">💵</span>
              </div>
              <div className="stat-value">₹{stats.today_revenue?.cash?.toFixed(2)}</div>
              <div className="stat-footer">Physical cash received</div>
            </div>

            <div className="card stat-card warning">
              <div className="stat-header">
                <span>UPI Collection</span>
                <span className="stat-icon">📱</span>
              </div>
              <div className="stat-value">₹{stats.today_revenue?.upi?.toFixed(2)}</div>
              <div className="stat-footer">Digital UPI payments</div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="card stat-card">
              <div className="stat-header">
                <span>Vehicles Inside</span>
                <span className="stat-icon">🅿️</span>
              </div>
              <div className="stat-value">{stats.current_inside}</div>
              <div className="stat-footer">Active parking inventory</div>
            </div>

            <div className="card stat-card success">
              <div className="stat-header">
                <span>Today's Entries</span>
                <span className="stat-icon">📥</span>
              </div>
              <div className="stat-value">{stats.today_entries}</div>
              <div className="stat-footer">Vehicles parked today</div>
            </div>

            <div className="card stat-card danger">
              <div className="stat-header">
                <span>Today's Exits</span>
                <span className="stat-icon">📤</span>
              </div>
              <div className="stat-value">{stats.today_exits}</div>
              <div className="stat-footer">Vehicles checked out today</div>
            </div>
          </div>

          <div className="dashboard-grid" style={{ marginTop: '1.5rem' }}>
            <div className="card stat-card success">
              <div className="stat-header">
                <span>Monthly Pass Report</span>
                <span className="stat-icon">🗓️</span>
              </div>
              <div className="stat-value">{stats.total_monthly_customers || 0}</div>
              <div className="stat-footer">Total monthly customers</div>
            </div>

            <div className="card stat-card warning">
              <div className="stat-header">
                <span>Paid Customers</span>
                <span className="stat-icon">✅</span>
              </div>
              <div className="stat-value">{stats.paid_monthly_customers || 0}</div>
              <div className="stat-footer">Customers with paid subscriptions</div>
            </div>

            <div className="card stat-card danger">
              <div className="stat-header">
                <span>Pending Customers</span>
                <span className="stat-icon">⚠️</span>
              </div>
              <div className="stat-value">{stats.pending_monthly_customers || 0}</div>
              <div className="stat-footer">Customers with pending payments</div>
            </div>

            <div className="card stat-card info">
              <div className="stat-header">
                <span>Monthly Collection</span>
                <span className="stat-icon">💵</span>
              </div>
              <div className="stat-value">₹{stats.monthly_revenue?.toFixed(2) || '0.00'}</div>
              <div className="stat-footer">Paid monthly subscriptions amount</div>
            </div>
          </div>

          <div className="dashboard-grid" style={{ marginTop: '1.5rem' }}>
            <div className="card stat-card warning">
              <div className="stat-header">
                <span>Casual Parking Report</span>
                <span className="stat-icon">🚗</span>
              </div>
              <div className="stat-value">{stats.casual_vehicle_count || 0}</div>
              <div className="stat-footer">Casual vehicles this month</div>
            </div>

            <div className="card stat-card info">
              <div className="stat-header">
                <span>Casual Revenue</span>
                <span className="stat-icon">💰</span>
              </div>
              <div className="stat-value">₹{stats.casual_revenue?.toFixed(2) || '0.00'}</div>
              <div className="stat-footer">Casual parking revenue this month</div>
            </div>

            <div className="card stat-card success">
              <div className="stat-header">
                <span>Combined Revenue</span>
                <span className="stat-icon">📈</span>
              </div>
              <div className="stat-value">₹{stats.total_revenue?.toFixed(2) || '0.00'}</div>
              <div className="stat-footer">Monthly + casual revenue</div>
            </div>
          </div>

          {/* Breakdown by vehicle type */}
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h3 className="section-title">
              Currently Parked Breakdown
              <span>By Vehicle Type</span>
            </h3>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle Type</th>
                    <th>Count Inside</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(stats.current_breakdown || {}).length === 0 ? (
                    <tr>
                      <td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No vehicles currently inside.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(stats.current_breakdown).map(([type, count]) => (
                      <tr key={type}>
                        <td style={{ fontWeight: 'bold' }}>{type}</td>
                        <td>
                          <span className="badge badge-warning" style={{ fontSize: '0.9rem' }}>
                            {count}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Printable Report View (Visible when printing A4 layout) */}
          <div className="print-report-container">
            <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
              <h1 style={{ textAlign: 'center', margin: '0 0 5px 0' }}>RAILWAY PARKING SYSTEM</h1>
              <h3 style={{ textAlign: 'center', margin: '0 0 20px 0', color: '#555' }}>DAILY REVENUE & MOVEMENT REPORT</h3>
              <p style={{ textAlign: 'right', fontSize: '0.9rem' }}>Generated: {new Date().toLocaleString()}</p>
              <hr style={{ margin: '15px 0' }} />

              <h4>1. Revenue Summary</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ background: '#f2f2f2' }}>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Category</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>Total Daily Revenue</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>₹{stats.today_revenue?.total?.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>- Cash Revenue</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>₹{stats.today_revenue?.cash?.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>- UPI / Online Revenue</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>₹{stats.today_revenue?.upi?.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <h4>2. Traffic Movement</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ background: '#f2f2f2' }}>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Metric</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>Vehicles Currently Inside</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{stats.current_inside}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>Today's Total Entries</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{stats.today_entries}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>Today's Total Exits</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{stats.today_exits}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
