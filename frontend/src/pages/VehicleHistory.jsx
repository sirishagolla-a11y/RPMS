import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import '../styles/App.css';

export default function VehicleHistory() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory('');
  }, []);

  const fetchHistory = async (searchQuery) => {
    setLoading(true);
    try {
      const data = await apiService.getHistory(searchQuery);
      setHistory(data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch parking history:', err);
      setError('Could not load parking record history.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    fetchHistory(value);
  };

  const filteredHistory = history.filter((item) => {
    if (statusFilter === 'ALL') return true;
    return item.status === statusFilter;
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)' }}>Vehicle Parking History</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Global log of all vehicle entries, exits, and payment records</p>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Filter controls */}
      <div className="history-filter-panel">
        <div className="filter-group" style={{ flex: '2 1 300px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Search Vehicle / Receipt</label>
          <input
            type="text"
            className="form-input"
            placeholder="Search by vehicle number..."
            value={query}
            onChange={handleSearchChange}
          />
        </div>

        <div className="filter-group">
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Filter by Status</label>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Records</option>
            <option value="PARKED">Currently Parked</option>
            <option value="RELEASED">Released / Completed</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading history...</p>
        ) : filteredHistory.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
            No parking records matching criteria.
          </p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt Number</th>
                  <th>Vehicle Number</th>
                  <th>Type</th>
                  <th>Entry Time</th>
                  <th>Exit Time</th>
                  <th>Fee Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {item.receipt_number}
                    </td>
                    <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {item.vehicle_number}
                    </td>
                    <td>
                      <span className="badge badge-warning">
                        {item.vehicle_type_details?.vehicle_type}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(item.entry_time).toLocaleString()}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {item.exit_time ? new Date(item.exit_time).toLocaleString() : '-'}
                    </td>
                    <td style={{ fontWeight: 'bold', color: item.fee_amount ? 'var(--accent-success)' : 'inherit' }}>
                      {item.fee_amount ? `₹${parseFloat(item.fee_amount).toFixed(2)}` : '-'}
                    </td>
                    <td>
                      {item.payment_method ? (
                        <span className="badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                          {item.payment_method}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={`badge ${item.status === 'PARKED' ? 'badge-warning' : 'badge-success'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
