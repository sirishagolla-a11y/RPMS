import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import '../styles/App.css';

export default function VehicleSearch() {
  const [query, setQuery] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchParkedVehicles('');
  }, []);

  const fetchParkedVehicles = async (searchQuery) => {
    setLoading(true);
    try {
      const data = await apiService.searchParked(searchQuery);
      setVehicles(data);
      setError('');
    } catch (err) {
      console.error('Failed to search parked vehicles:', err);
      setError('Could not fetch active parked vehicles.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    fetchParkedVehicles(value);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)' }}>Currently Parked Vehicles</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Real-time inventory of vehicles inside the parking lot</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => fetchParkedVehicles(query)}>
            🔄 Refresh List
          </button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Search Input Bar */}
      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="form-input"
            placeholder="Search by vehicle number or receipt number..."
            value={query}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading active vehicles...</p>
        ) : vehicles.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
            No vehicles currently parked inside.
          </p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle Number</th>
                  <th>Vehicle Type</th>
                  <th>Receipt Number</th>
                  <th>Entry Date & Time</th>
                  <th>Time Elapsed</th>
                  <th>Customer Info</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {item.vehicle_number}
                    </td>
                    <td>
                      <span className="badge badge-warning">
                        {item.vehicle_type_details?.vehicle_type}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {item.receipt_number}
                    </td>
                    <td>
                      {new Date(item.entry_time).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-success">
                        {item.duration_minutes} Mins
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {item.customer_name ? (
                        <div>
                          <div>{item.customer_name}</div>
                          {item.customer_phone && <div style={{ color: 'var(--text-muted)' }}>{item.customer_phone}</div>}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => navigate('/release')}
                      >
                        Release Vehicle
                      </button>
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
