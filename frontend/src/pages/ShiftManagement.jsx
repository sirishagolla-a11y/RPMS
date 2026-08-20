import React, { useState } from 'react';
import { apiService } from '../services/api';
import '../styles/App.css';

export default function ShiftManagement({ currentShift, onRefreshShift }) {
  const [operatorName, setOperatorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleOpenShift = async (e) => {
    e.preventDefault();
    if (!operatorName.trim()) return;

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await apiService.openShift(operatorName.trim());
      setSuccessMsg('Shift opened successfully!');
      setOperatorName('');
      await onRefreshShift();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to open shift.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!window.confirm('Are you sure you want to close the current shift? This will end your session.')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await apiService.closeShift();
      setSuccessMsg('Shift closed successfully!');
      await onRefreshShift();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to close shift.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintSummary = () => {
    window.print();
  };

  const activeShift = currentShift?.shift;
  const isShiftOpen = currentShift?.active;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>Shift Management</h2>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-success)', color: 'var(--accent-success)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {successMsg}
        </div>
      )}

      {!isShiftOpen ? (
        <div className="card form-card">
          <h3 className="form-title">Start Operator Shift</h3>
          <form onSubmit={handleOpenShift}>
            <div className="form-group">
              <label htmlFor="operator-name">Operator Name</label>
              <input
                id="operator-name"
                type="text"
                className="form-input"
                placeholder="Enter operator's full name"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || !operatorName.trim()}>
              {loading ? 'Starting Shift...' : 'Open Shift'}
            </button>
          </form>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ borderLeft: '4px solid var(--accent-success)' }}>
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flexGrow: 1 }}>
                <span className="badge badge-success" style={{ marginBottom: '0.5rem' }}>Shift Active</span>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{activeShift.operator_name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Started on {activeShift.shift_date} at {new Date(activeShift.start_time).toLocaleTimeString()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handlePrintSummary} className="btn btn-secondary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  Print Shift Summary
                </button>
                <button onClick={handleCloseShift} className="btn btn-primary" style={{ backgroundColor: 'var(--accent-danger)' }} disabled={loading}>
                  {loading ? 'Closing...' : 'Close Shift'}
                </button>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="card stat-card success">
              <div className="stat-header">
                <span>Total Collection</span>
                <span className="stat-icon">💰</span>
              </div>
              <div className="stat-value">₹{activeShift.total_revenue?.toFixed(2) || '0.00'}</div>
              <div className="stat-footer">Today's total shift revenue</div>
            </div>

            <div className="card stat-card info">
              <div className="stat-header">
                <span>Cash Collection</span>
                <span className="stat-icon">💵</span>
              </div>
              <div className="stat-value">₹{activeShift.cash_revenue?.toFixed(2) || '0.00'}</div>
              <div className="stat-footer">Cash payments processed</div>
            </div>

            <div className="card stat-card warning">
              <div className="stat-header">
                <span>UPI Collection</span>
                <span className="stat-icon">📱</span>
              </div>
              <div className="stat-value">₹{activeShift.upi_revenue?.toFixed(2) || '0.00'}</div>
              <div className="stat-footer">UPI/Online payments processed</div>
            </div>

            <div className="card stat-card">
              <div className="stat-header">
                <span>Vehicles Handled</span>
                <span className="stat-icon">🚗</span>
              </div>
              <div className="stat-value">{activeShift.total_vehicles || 0}</div>
              <div className="stat-footer">Total active + completed entries</div>
            </div>
          </div>
          
          {/* Printable Area Specific style wrapper (A4 print layout) */}
          <div className="print-report-container">
            <div style={{ fontFamily: 'Courier New, Courier, monospace', color: '#000', padding: '20px', border: '1px solid #000' }}>
              <h2 style={{ textAlign: 'center', textTransform: 'uppercase', marginBottom: '10px' }}>Railway Parking Management</h2>
              <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Shift Summary Report</h3>
              <hr style={{ borderTop: '1px dashed #000', marginBottom: '15px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Operator Name:</span>
                <span style={{ fontWeight: 'bold' }}>{activeShift.operator_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Shift Date:</span>
                <span>{activeShift.shift_date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Start Time:</span>
                <span>{new Date(activeShift.start_time).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Status:</span>
                <span style={{ fontWeight: 'bold' }}>{activeShift.status}</span>
              </div>
              <hr style={{ borderTop: '1px dashed #000', margin: '15px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '1.1rem' }}>
                <span>Total Collection:</span>
                <span style={{ fontWeight: 'bold' }}>₹{activeShift.total_revenue?.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingLeft: '15px' }}>
                <span>- Cash Revenue:</span>
                <span>₹{activeShift.cash_revenue?.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingLeft: '15px' }}>
                <span>- UPI Revenue:</span>
                <span>₹{activeShift.upi_revenue?.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Total Vehicles Handled:</span>
                <span>{activeShift.total_vehicles}</span>
              </div>
              <hr style={{ borderTop: '1px dashed #000', marginTop: '20px' }} />
              <p style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '30px' }}>Printed on: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
