import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import '../styles/App.css';
import '../styles/receipt-print.css';

export default function VehicleEntry({ currentShift }) {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [rates, setRates] = useState([]);
  const [selectedRateId, setSelectedRateId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Verification states
  const [checkedType, setCheckedType] = useState(null); // 'CASUAL' or 'MONTHLY'
  const [subscriptionStatus, setSubscriptionStatus] = useState(null); // 'ACTIVE' or 'EXPIRED'
  const [subDetails, setSubDetails] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Receipt/Print states
  const [createdRecord, setCreatedRecord] = useState(null);
  const [createdRenewalReceipt, setCreatedRenewalReceipt] = useState(null);
  const [showRenewalForm, setShowRenewalForm] = useState(false);
  const [renewalPaymentMethod, setRenewalPaymentMethod] = useState('CASH');

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const data = await apiService.getRates();
      setRates(data);
      if (data.length > 0) {
        setSelectedRateId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch vehicle rates:', err);
      setError('Could not load vehicle rates.');
    }
  };

  // Automated check vehicle when vehicle number is inputted (length >= 4)
  const handleVehicleNumberChange = async (val) => {
    const cleanVal = val.toUpperCase().replace(/\s+/g, '');
    setVehicleNumber(cleanVal);
    setError('');
    setSuccessMsg('');
    setCreatedRecord(null);
    setCreatedRenewalReceipt(null);
    setShowRenewalForm(false);

    if (cleanVal.length >= 4) {
      setChecking(true);
      try {
        const check = await apiService.checkVehicle(cleanVal);
        setCheckedType(check.type); // 'CASUAL' or 'MONTHLY'
        if (check.type === 'MONTHLY') {
          setSubscriptionStatus(check.subscription_status); // 'ACTIVE' or 'EXPIRED'
          setSubDetails(check);
          if (check.subscription_status === 'EXPIRED') {
            setShowRenewalForm(true);
          }
        } else {
          setSubscriptionStatus(null);
          setSubDetails(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setChecking(false);
      }
    } else {
      setCheckedType(null);
      setSubscriptionStatus(null);
      setSubDetails(null);
    }
  };

  const handleParkVehicle = async (e) => {
    if (e) e.preventDefault();
    if (!vehicleNumber.trim()) return;

    if (!currentShift?.active) {
      setError('No active shift open. Please start a shift first!');
      return;
    }

    setLoading(true);
    setError('');
    setCreatedRecord(null);

    try {
      const payload = {
        vehicle_number: vehicleNumber.trim().toUpperCase(),
        vehicle_type: checkedType === 'MONTHLY' ? null : selectedRateId,
        customer_name: customerName.trim() || null,
        customer_phone: customerPhone.trim() || null,
      };

      const result = await apiService.recordEntry(payload);
      setCreatedRecord(result.record || result);
      setSuccessMsg('Vehicle parked successfully!');
      
      // Reset
      setVehicleNumber('');
      setCustomerName('');
      setCustomerPhone('');
      setCheckedType(null);
      setSubscriptionStatus(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to park vehicle.');
    } finally {
      setLoading(false);
    }
  };

  const handleRenewPass = async (e) => {
    e.preventDefault();
    if (!vehicleNumber.trim() || !subDetails) return;

    setLoading(true);
    setError('');
    setCreatedRenewalReceipt(null);

    try {
      const payload = {
        vehicle_number: vehicleNumber,
        amount: subDetails.amount_due || 300,
        payment_method: renewalPaymentMethod
      };
      
      const paymentResult = await apiService.renewMonthlyPass(payload);
      setCreatedRenewalReceipt(paymentResult);
      setSuccessMsg('Monthly pass renewed successfully!');
      setShowRenewalForm(false);
      
      // After renewal, automatically park the vehicle!
      handleParkVehicle();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to renew monthly pass.');
      setLoading(false);
    }
  };

  const handlePrintEntry = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      <h2 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>📥 Vehicle Entry</h2>

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

      <div className="card form-card">
        <h3 className="form-title" style={{ fontSize: '1.25rem' }}>Enter Vehicle Number Only</h3>
        <div className="form-group">
          <input
            id="vehicle-number"
            type="text"
            className="form-input"
            style={{ fontSize: '1.5rem', textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.05em', padding: '0.75rem' }}
            placeholder="e.g. AP39AB1234"
            value={vehicleNumber}
            onChange={(e) => handleVehicleNumberChange(e.target.value)}
            required
            autoFocus
            disabled={loading}
          />
          {checking && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem' }}>Verifying pass database...</p>}
        </div>

        {/* Dynamic Workflow Decisions */}
        {vehicleNumber.length >= 4 && !checking && (
          <div className="animate-fade-in" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)' }}>
            
            {/* CASUAL VEHICLE WORKFLOW */}
            {checkedType === 'CASUAL' && (
              <div>
                <span className="badge badge-success" style={{ marginBottom: '1rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Casual Vehicle Identified</span>
                
                <div className="form-group">
                  <label htmlFor="vehicle-type">Select Vehicle Type</label>
                  <select
                    id="vehicle-type"
                    className="form-select"
                    value={selectedRateId}
                    onChange={(e) => setSelectedRateId(e.target.value)}
                    required
                  >
                    {rates.map((rate) => (
                      <option key={rate.id} value={rate.id}>
                        {rate.vehicle_type} (Min: ₹{rate.minimum_charge}, Hr: ₹{rate.hourly_rate})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Driver Name (Optional)</label>
                    <input type="text" className="form-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Phone Number (Optional)</label>
                    <input type="tel" className="form-input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                  </div>
                </div>

                <button onClick={handleParkVehicle} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }} disabled={loading || !currentShift?.active}>
                  {loading ? 'Parking...' : 'Confirm Casual Parking Entry'}
                </button>
              </div>
            )}

            {/* MONTHLY PASS ACTIVE */}
            {checkedType === 'MONTHLY' && subscriptionStatus === 'ACTIVE' && subDetails && (
              <div style={{ textAlign: 'center' }}>
                <span className="badge badge-success" style={{ marginBottom: '1rem', padding: '0.5rem 1rem', fontSize: '0.9rem', backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                  ✅ Monthly Pass Active
                </span>
                
                <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.95rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Owner Name:</span>
                    <strong style={{ color: '#fff' }}>{subDetails.customer?.owner_name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Expiry Date:</span>
                    <strong style={{ color: 'var(--accent-success)' }}>{new Date(subDetails.expiry_date).toLocaleDateString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Days Remaining:</span>
                    <strong style={{ color: 'var(--accent-success)' }}>{subDetails.remaining_days} Days</strong>
                  </div>
                </div>

                <button onClick={handleParkVehicle} className="btn btn-success" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={loading || !currentShift?.active}>
                  {loading ? 'Parking...' : 'Confirm Monthly Parking Entry (₹0)'}
                </button>
              </div>
            )}

            {/* MONTHLY PASS EXPIRED */}
            {checkedType === 'MONTHLY' && subscriptionStatus === 'EXPIRED' && subDetails && (
              <div style={{ textAlign: 'center' }}>
                <span className="badge badge-danger" style={{ marginBottom: '1rem', padding: '0.5rem 1rem', fontSize: '0.9rem', backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                  ❌ Monthly Pass Expired
                </span>
                
                <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'left' }}>
                  <h4 style={{ color: 'var(--accent-danger)', marginBottom: '0.75rem' }}>Pass Details</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Expiry Date:</span>
                    <strong>{new Date(subDetails.expiry_date).toLocaleDateString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Days Overdue:</span>
                    <strong style={{ color: 'var(--accent-danger)' }}>{subDetails.days_overdue} Days</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold', borderTop: '1px solid var(--border-glass)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Amount Due:</span>
                    <span style={{ color: 'var(--accent-danger)' }}>₹{subDetails.amount_due}</span>
                  </div>
                </div>

                {showRenewalForm ? (
                  <form onSubmit={handleRenewPass} className="card" style={{ backgroundColor: 'var(--bg-tertiary)', textAlign: 'left', padding: '1rem' }}>
                    <h4 style={{ marginBottom: '0.75rem' }}>Renew Pass & Park</h4>
                    <div className="form-group">
                      <label>Payment Method</label>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <button type="button" className={`btn ${renewalPaymentMethod === 'CASH' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setRenewalPaymentMethod('CASH')}>
                          💵 Cash
                        </button>
                        <button type="button" className={`btn ${renewalPaymentMethod === 'UPI' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setRenewalPaymentMethod('UPI')}>
                          📱 UPI
                        </button>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                      {loading ? 'Renewing...' : `Pay ₹${subDetails.amount_due} & Auto-Park`}
                    </button>
                  </form>
                ) : (
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => setShowRenewalForm(true)} style={{ flex: 1 }}>
                      Renew Monthly Pass
                    </button>
                    <button className="btn btn-secondary" onClick={() => apiService.sendMonthlyReminder(subDetails.customer.id)} style={{ flex: 1 }}>
                      Send Reminder
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>

      {/* Parking Ticket Preview Modal */}
      {createdRecord && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--accent-success)' }}>Entry Ticket Generated</h3>
              <span className="modal-close-btn" onClick={() => setCreatedRecord(null)}>&times;</span>
            </div>

            <div className="modal-body">
              <div className="receipt-preview-card">
                <div className="receipt-header-text">RAILWAY PARKING</div>
                <div style={{ textAlign: 'center', fontSize: '0.75rem' }}>ENTRY RECEIPT</div>
                <div className="receipt-divider"></div>
                <div className="receipt-row"><span className="label">Receipt No:</span><span>{createdRecord.receipt_number}</span></div>
                <div className="receipt-row"><span className="label">Vehicle No:</span><span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{createdRecord.vehicle_number}</span></div>
                <div className="receipt-row"><span className="label">Type:</span><span>{createdRecord.customer_type}</span></div>
                <div className="receipt-row"><span className="label">Entry Date:</span><span>{createdRecord.entry_date}</span></div>
                <div className="receipt-row"><span className="label">Entry Time:</span><span>{new Date(createdRecord.entry_time).toLocaleTimeString()}</span></div>
                <div className="receipt-divider"></div>
                {createdRecord.customer_type === 'MONTHLY' ? (
                  <div style={{ textAlign: 'center', fontWeight: 'bold', color: 'green' }}>MONTHLY PASS ACTIVE</div>
                ) : (
                  <>
                    <div className="receipt-row"><span>Min Charge:</span><span>₹{createdRecord.vehicle_type_details?.minimum_charge}</span></div>
                    <div className="receipt-row"><span>Hourly Rate:</span><span>₹{createdRecord.vehicle_type_details?.hourly_rate}/hr</span></div>
                  </>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCreatedRecord(null)}>Close</button>
              <button className="btn btn-success" onClick={handlePrintEntry}>Print Ticket</button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print container for POS printing */}
      {createdRecord && (
        <div className="print-receipt-container">
          <div className="thermal-receipt">
            <div className="thermal-receipt-center thermal-receipt-title">RAILWAY PARKING</div>
            <div className="thermal-receipt-center thermal-receipt-subtitle">ENTRY RECEIPT</div>
            <div className="thermal-receipt-divider"></div>
            <div className="thermal-receipt-row"><span>Receipt #:</span><span className="thermal-receipt-bold">{createdRecord.receipt_number}</span></div>
            <div className="thermal-receipt-row"><span>Vehicle No:</span><span className="thermal-receipt-bold">{createdRecord.vehicle_number}</span></div>
            <div className="thermal-receipt-row"><span>Type:</span><span>{createdRecord.customer_type}</span></div>
            <div className="thermal-receipt-row"><span>Date:</span><span>{createdRecord.entry_date}</span></div>
            <div className="thermal-receipt-row"><span>Time:</span><span>{new Date(createdRecord.entry_time).toLocaleTimeString()}</span></div>
            <div className="thermal-receipt-divider"></div>
            <div className="thermal-receipt-footer">*** RAILWAY PARKING SECURITY ***</div>
          </div>
        </div>
      )}
      
      {/* Monthly Payment Receipt Modal */}
      {createdRenewalReceipt && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--accent-success)' }}>Renewal Payment Success</h3>
              <span className="modal-close-btn" onClick={() => setCreatedRenewalReceipt(null)}>&times;</span>
            </div>
            <div className="modal-body">
              <div className="receipt-preview-card">
                <div className="receipt-header-text">MONTHLY PASS PAYMENT</div>
                <div style={{ textAlign: 'center', fontSize: '0.75rem' }}>OFFICIAL RECEIPT</div>
                <div className="receipt-divider"></div>
                <div className="receipt-row"><span className="label">Receipt No:</span><span>{createdRenewalReceipt.receipt_number}</span></div>
                <div className="receipt-row"><span className="label">Vehicle No:</span><strong>{createdRenewalReceipt.customer_details?.vehicle_number}</strong></div>
                <div className="receipt-row"><span className="label">Owner Name:</span><span>{createdRenewalReceipt.customer_details?.owner_name}</span></div>
                <div className="receipt-row"><span className="label">Payment Date:</span><span>{createdRenewalReceipt.payment_date}</span></div>
                <div className="receipt-row"><span className="label">Amount Paid:</span><strong>₹{parseFloat(createdRenewalReceipt.amount_paid).toFixed(2)}</strong></div>
                <div className="receipt-row"><span className="label">Payment Method:</span><span>{createdRenewalReceipt.payment_method}</span></div>
                <div className="receipt-row"><span className="label">Next Expiry:</span><strong style={{ color: 'green' }}>{createdRenewalReceipt.next_expiry_date}</strong></div>
                <div className="receipt-row"><span className="label">Operator:</span><span>{createdRenewalReceipt.operator_name}</span></div>
                <div className="receipt-divider"></div>
                <div style={{ textAlign: 'center', fontWeight: 'bold' }}>Status: {createdRenewalReceipt.status}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCreatedRenewalReceipt(null)}>Close</button>
              <button className="btn btn-success" onClick={handlePrintEntry}>Print Renewal Receipt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
