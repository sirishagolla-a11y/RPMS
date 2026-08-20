import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import '../styles/App.css';

export default function MonthlyPass() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [rates, setRates] = useState([]);

  const [form, setForm] = useState({
    vehicle_number: '',
    owner_name: '',
    phone_number: '',
    vehicle_type: '',
    monthly_amount: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchRates();
    fetchCustomers();
  }, []);

  const fetchRates = async () => {
    try {
      const data = await apiService.getRates();
      setRates(data);
      if (data.length > 0 && !form.vehicle_type) {
        setForm((prev) => ({ ...prev, vehicle_type: data[0].id.toString() }));
      }
    } catch (err) {
      console.error('Failed to fetch vehicle rates:', err);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiService.getMonthlyCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load monthly customers:', err);
      setError('Could not load monthly customers.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.addMonthlyCustomer({
        vehicle_number: form.vehicle_number.trim().toUpperCase(),
        owner_name: form.owner_name.trim(),
        phone_number: form.phone_number.trim(),
        vehicle_type: form.vehicle_type,
        monthly_amount: form.monthly_amount,
        start_date: form.start_date,
        end_date: form.end_date,
      });

      setSuccess('Monthly customer added successfully.');
      setForm({
        vehicle_number: '',
        owner_name: '',
        phone_number: '',
        vehicle_type: rates[0]?.id?.toString() || '',
        monthly_amount: '',
        start_date: '',
        end_date: '',
      });
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add monthly customer.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResult(null);
      return;
    }

    try {
      const data = await apiService.searchMonthlyCustomer(searchQuery.trim().toUpperCase());
      setSearchResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'No monthly customer found.');
      setSearchResult(null);
    }
  };

  const handleMarkPaid = async (customerId) => {
    if (!window.confirm('Mark this monthly payment as paid?')) return;

    try {
      await apiService.updateMonthlyPayment({
        customer_id: customerId,
        payment_status: 'PAID',
        payment_date: new Date().toISOString().slice(0, 10),
      });
      setSuccess('Payment marked as paid.');
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update payment.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)' }}>Monthly Pass Management</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Manage monthly parking customers, subscriptions, and payment status.
        </p>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--accent-success)', color: 'var(--accent-success)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
          {success}
        </div>
      )}

      <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card form-card">
          <h3 className="form-title">Add Monthly Customer</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="vehicle_number">Vehicle Number *</label>
                <input id="vehicle_number" name="vehicle_number" className="form-input" value={form.vehicle_number} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="owner_name">Owner Name *</label>
                <input id="owner_name" name="owner_name" className="form-input" value={form.owner_name} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="phone_number">Phone Number *</label>
                <input id="phone_number" name="phone_number" className="form-input" value={form.phone_number} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="vehicle_type">Vehicle Type *</label>
                <select id="vehicle_type" name="vehicle_type" className="form-select" value={form.vehicle_type} onChange={handleChange} required>
                  {rates.map((rate) => (
                    <option key={rate.id} value={rate.id}>{rate.vehicle_type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="monthly_amount">Monthly Amount *</label>
                <input id="monthly_amount" name="monthly_amount" type="number" className="form-input" value={form.monthly_amount} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="start_date">Start Date</label>
                <input id="start_date" name="start_date" type="date" className="form-input" value={form.start_date} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="end_date">End Date</label>
              <input id="end_date" name="end_date" type="date" className="form-input" value={form.end_date} onChange={handleChange} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }} disabled={loading}>
              {loading ? 'Saving...' : 'Add Monthly Customer'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 className="section-title">Search Monthly Vehicle</h3>
          <form onSubmit={handleSearch}>
            <div className="form-group">
              <label htmlFor="search_vehicle">Vehicle Number</label>
              <input id="search_vehicle" className="form-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value.toUpperCase())} placeholder="Search vehicle number" />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
              Search
            </button>
          </form>

          {searchResult && (
            <div style={{ marginTop: '1rem', padding: '0.9rem', borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.08)' }}>
              <div><strong>Vehicle:</strong> {searchResult.customer?.vehicle_number}</div>
              <div><strong>Owner:</strong> {searchResult.customer?.owner_name}</div>
              <div><strong>Phone:</strong> {searchResult.customer?.phone_number}</div>
              <div><strong>Status:</strong> {searchResult.current_month_subscription?.payment_status}</div>
              <div><strong>Amount:</strong> ₹{searchResult.current_month_subscription?.amount}</div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Monthly Customers</h3>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading monthly customers...</p>
        ) : customers.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No monthly customers found.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle Number</th>
                  <th>Owner Name</th>
                  <th>Phone Number</th>
                  <th>Monthly Amount</th>
                  <th>Payment Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.vehicle_number}</td>
                    <td>{customer.owner_name}</td>
                    <td>{customer.phone_number}</td>
                    <td>₹{customer.monthly_amount}</td>
                    <td>{customer.payment_status}</td>
                    <td>{customer.validity?.start_date || '-'}</td>
                    <td>{customer.validity?.end_date || '-'}</td>
                    <td>
                      <button className="btn btn-success" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }} onClick={() => handleMarkPaid(customer.id)}>
                        Mark Paid
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
