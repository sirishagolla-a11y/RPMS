import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import '../styles/App.css';
import '../styles/receipt-print.css';

export default function VehicleRelease({ currentShift }) {
  const [vehicleNumber, setVehicleNumber] = useState('');
  
  // Search results
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Decision States
  const [vehicleDetails, setVehicleDetails] = useState(null);
  
  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [releasedReceipt, setReleasedReceipt] = useState(null);
  const [renewalReceipt, setRenewalReceipt] = useState(null);
  const [showRenewalForm, setShowRenewalForm] = useState(false);

  const handleSearchChange = async (val) => {
    const cleanVal = val.toUpperCase().replace(/\s+/g, '');
    setVehicleNumber(cleanVal);
    setError('');
    setSuccessMsg('');
    setVehicleDetails(null);
    setReleasedReceipt(null);
    setRenewalReceipt(null);
    setShowRenewalForm(false);

    if (cleanVal.length >= 4) {
      setChecking(true);
      try {
        const check = await apiService.checkVehicle(cleanVal);
        if (check.status === 'PARKED' || check.type === 'MONTHLY') {
          setVehicleDetails(check);
          if (check.subscription_status === 'EXPIRED') {
            setShowRenewalForm(true);
          }
        } else {
          setVehicleDetails(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setChecking(false);
      }
    }
  };

  const handleProcessRelease = async () => {
    if (!vehicleDetails || !vehicleDetails.record) return;
    if (!currentShift?.active) {
      setError('No active shift open. Please start a shift first!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await apiService.releaseVehicle(
        vehicleDetails.record.id,
        vehicleDetails.type === 'MONTHLY' ? 'CASH' : paymentMethod
      );
      setReleasedReceipt(result.record || result);
      setSuccessMsg('Vehicle released successfully!');
      setVehicleDetails(null);
      setVehicleNumber('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to release vehicle.');
    } finally {
      setLoading(false);
    }
  };

  const handleRenewPass = async (e) => {
    e.preventDefault();
    if (!vehicleDetails || !vehicleDetails.customer) return;
    if (!currentShift?.active) {
      setError('No active shift open. Please start a shift first!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        vehicle_number: vehicleDetails.customer.vehicle_number,
        amount: vehicleDetails.amount_due || 300,
        payment_method: paymentMethod
      };
      
      const paymentResult = await apiService.renewMonthlyPass(payload);
      setRenewalReceipt(paymentResult);
      setSuccessMsg('Monthly Pass Renewed & Vehicle Automatically Released!');
      setVehicleDetails(null);
      setVehicleNumber('');
      setShowRenewalForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process renewal.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      <h2 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>📤 Vehicle Exit & Release</h2>

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

      {/* Search Input Bar */}
      <div className="card form-card">
        <h3 className="form-title" style={{ fontSize: '1.25rem' }}>Enter Vehicle Number</h3>
        <div className="form-group">
          <input
            type="text"
            className="form-input"
            style={{ fontSize: '1.5rem', textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.05em', padding: '0.75rem' }}
            placeholder="Search e.g. AP39AB1234"
            value={vehicleNumber}
            onChange={(e) => handleSearchChange(e.target.value)}
            autoFocus
            disabled={loading}
          />
          {checking && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem' }}>Verifying active session...</p>}
        </div>

        {vehicleNumber.length >= 4 && !checking && (
          <div className="animate-fade-in" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)' }}>
            
            {/* If vehicle is not parked anywhere */}
            {(!vehicleDetails || vehicleDetails.status === 'NOT_PARKED') && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <span className="badge badge-danger" style={{ padding: '0.5rem 1rem' }}>No Active Parking Session Found</span>
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>This vehicle is not registered as currently parked inside.</p>
              </div>
            )}

            {/* CASUAL VEHICLE RELEASE */}
            {vehicleDetails && vehicleDetails.type === 'CASUAL' && vehicleDetails.status === 'PARKED' && (
              <div>
                <span className="badge badge-warning" style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Casual Vehicle Checkout</span>
                
                <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Entry Date & Time:</span>
                    <span>{new Date(vehicleDetails.record.entry_time).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Duration Parked:</span>
                    <strong>{vehicleDetails.duration_minutes} Mins ({vehicleDetails.hours} Hours)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', borderTop: '1px solid var(--border-glass)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Parking Charge:</span>
                    <span style={{ color: 'var(--accent-success)' }}>₹{vehicleDetails.calculated_fee.toFixed(2)}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Select Payment Method</label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button type="button" className={`btn ${paymentMethod === 'CASH' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setPaymentMethod('CASH')}>
                      💵 Cash
                    </button>
                    <button type="button" className={`btn ${paymentMethod === 'UPI' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setPaymentMethod('UPI')}>
                      📱 UPI
                    </button>
                  </div>
                </div>

                <button onClick={handleProcessRelease} className="btn btn-success" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '1.5rem' }} disabled={loading || !currentShift?.active}>
                  {loading ? 'Processing...' : `Pay ₹${vehicleDetails.calculated_fee.toFixed(2)} & Release Vehicle`}
                </button>
              </div>
            )}

            {/* MONTHLY PASS ACTIVE RELEASE */}
            {vehicleDetails && vehicleDetails.type === 'MONTHLY' && vehicleDetails.subscription_status === 'ACTIVE' && vehicleDetails.status === 'PARKED' && (
              <div style={{ textAlign: 'center' }}>
                <span className="badge badge-success" style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Monthly Pass Active</span>
                
                <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Owner Name:</span>
                    <strong>{vehicleDetails.customer?.owner_name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Expiry Date:</span>
                    <strong style={{ color: 'var(--accent-success)' }}>{new Date(vehicleDetails.expiry_date).toLocaleDateString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Remaining Days:</span>
                    <strong style={{ color: 'var(--accent-success)' }}>{vehicleDetails.remaining_days} Days</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', borderTop: '1px solid var(--border-glass)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Parking Charge:</span>
                    <span style={{ color: 'var(--accent-success)' }}>₹0.00</span>
                  </div>
                </div>

                <button onClick={handleProcessRelease} className="btn btn-success" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={loading || !currentShift?.active}>
                  {loading ? 'Processing...' : 'Confirm Free Exit & Release'}
                </button>
              </div>
            )}

            {/* MONTHLY PASS EXPIRED RELEASE */}
            {vehicleDetails && vehicleDetails.type === 'MONTHLY' && vehicleDetails.subscription_status === 'EXPIRED' && (
              <div style={{ textAlign: 'center' }}>
                <span className="badge badge-danger" style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem', backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                  ❌ Monthly Pass Expired
                </span>
                
                <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Owner Name:</span>
                    <strong>{vehicleDetails.customer?.owner_name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Expiry Date:</span>
                    <strong>{new Date(vehicleDetails.expiry_date).toLocaleDateString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Days Overdue:</span>
                    <strong style={{ color: 'var(--accent-danger)' }}>{vehicleDetails.days_overdue} Days</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', borderTop: '1px solid var(--border-glass)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Amount Due for Renewal:</span>
                    <span style={{ color: 'var(--accent-danger)' }}>₹{vehicleDetails.amount_due}</span>
                  </div>
                </div>

                {showRenewalForm ? (
                  <form onSubmit={handleRenewPass} className="card" style={{ backgroundColor: 'var(--bg-tertiary)', textAlign: 'left', padding: '1rem' }}>
                    <h4 style={{ marginBottom: '0.75rem' }}>Renew Pass & Release Vehicle</h4>
                    <div className="form-group">
                      <label>Payment Method</label>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <button type="button" className={`btn ${paymentMethod === 'CASH' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setPaymentMethod('CASH')}>
                          💵 Cash
                        </button>
                        <button type="button" className={`btn ${paymentMethod === 'UPI' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setPaymentMethod('UPI')}>
                          📱 UPI
                        </button>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                      {loading ? 'Renewing & Releasing...' : `Pay ₹${vehicleDetails.amount_due} & Release`}
                    </button>
                  </form>
                ) : (
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => setShowRenewalForm(true)} style={{ flex: 1 }}>
                      Renew Monthly Pass
                    </button>
                    <button className="btn btn-secondary" onClick={() => apiService.sendMonthlyReminder(vehicleDetails.customer.id)} style={{ flex: 1 }}>
                      Send Reminder
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>

      {/* Exit Receipt Modal */}
      {releasedReceipt && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--accent-success)' }}>Exit Ticket Generated</h3>
              <span className="modal-close-btn" onClick={() => setReleasedReceipt(null)}>&times;</span>
            </div>

            <div className="modal-body">
              <div className="receipt-preview-card">
                <div className="receipt-header-text">RAILWAY PARKING</div>
                <div style={{ textAlign: 'center', fontSize: '0.75rem' }}>EXIT RECEIPT</div>
                <div className="receipt-divider"></div>
                <div className="receipt-row"><span className="label">Receipt No:</span><span>{releasedReceipt.receipt_number}</span></div>
                <div className="receipt-row"><span className="label">Vehicle No:</span><span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{releasedReceipt.vehicle_number}</span></div>
                <div className="receipt-row"><span className="label">Type:</span><span>{releasedReceipt.customer_type}</span></div>
                <div className="receipt-divider"></div>
                <div className="receipt-row"><span>Entry:</span><span>{new Date(releasedReceipt.entry_time).toLocaleTimeString()}</span></div>
                <div className="receipt-row"><span>Exit:</span><span>{new Date(releasedReceipt.exit_time).toLocaleTimeString()}</span></div>
                <div className="receipt-row"><span>Duration:</span><span>{releasedReceipt.duration_minutes} Mins</span></div>
                <div className="receipt-divider"></div>
                <div className="receipt-row" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                  <span>Total Fee Paid:</span>
                  <span>₹{parseFloat(releasedReceipt.fee_amount).toFixed(2)}</span>
                </div>
                {releasedReceipt.payment_method && (
                  <div className="receipt-row"><span>Method:</span><span>{releasedReceipt.payment_method}</span></div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setReleasedReceipt(null)}>Close</button>
              <button className="btn btn-success" onClick={handlePrintReceipt}>Print Exit Receipt</button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Container */}
      {releasedReceipt && (
        <div className="print-receipt-container">
          <div className="thermal-receipt">
            <div className="thermal-receipt-center thermal-receipt-title">RAILWAY PARKING</div>
            <div className="thermal-receipt-center thermal-receipt-subtitle">EXIT RECEIPT</div>
            <div className="thermal-receipt-divider"></div>
            <div className="thermal-receipt-row"><span>Receipt #:</span><span className="thermal-receipt-bold">{releasedReceipt.receipt_number}</span></div>
            <div className="thermal-receipt-row"><span>Vehicle No:</span><span className="thermal-receipt-bold">{releasedReceipt.vehicle_number}</span></div>
            <div className="thermal-receipt-row"><span>Entry Time:</span><span>{new Date(releasedReceipt.entry_time).toLocaleString()}</span></div>
            <div className="thermal-receipt-row"><span>Exit Time:</span><span>{new Date(releasedReceipt.exit_time).toLocaleString()}</span></div>
            <div className="thermal-receipt-divider"></div>
            <div className="thermal-receipt-row thermal-receipt-bold" style={{ fontSize: '1.1rem' }}>
              <span>Paid Amount:</span>
              <span>₹{parseFloat(releasedReceipt.fee_amount).toFixed(2)}</span>
            </div>
            <div className="thermal-receipt-divider"></div>
            <div className="thermal-receipt-footer">*** PAID - THANK YOU ***</div>
          </div>
        </div>
      )}
      
      {/* Monthly Payment Receipt Modal */}
      {renewalReceipt && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--accent-success)' }}>Renewal Payment Success</h3>
              <span className="modal-close-btn" onClick={() => setRenewalReceipt(null)}>&times;</span>
            </div>
            <div className="modal-body">
              <div className="receipt-preview-card">
                <div className="receipt-header-text">MONTHLY PASS PAYMENT</div>
                <div style={{ textAlign: 'center', fontSize: '0.75rem' }}>OFFICIAL RECEIPT</div>
                <div className="receipt-divider"></div>
                <div className="receipt-row"><span className="label">Receipt No:</span><span>{renewalReceipt.receipt_number}</span></div>
                <div className="receipt-row"><span className="label">Vehicle No:</span><strong>{renewalReceipt.customer_details?.vehicle_number}</strong></div>
                <div className="receipt-row"><span className="label">Owner Name:</span><span>{renewalReceipt.customer_details?.owner_name}</span></div>
                <div className="receipt-row"><span className="label">Payment Date:</span><span>{renewalReceipt.payment_date}</span></div>
                <div className="receipt-row"><span className="label">Amount Paid:</span><strong>₹{parseFloat(renewalReceipt.amount_paid).toFixed(2)}</strong></div>
                <div className="receipt-row"><span className="label">Payment Method:</span><span>{renewalReceipt.payment_method}</span></div>
                <div className="receipt-row"><span className="label">Next Expiry:</span><strong style={{ color: 'green' }}>{renewalReceipt.next_expiry_date}</strong></div>
                <div className="receipt-row"><span className="label">Operator:</span><span>{renewalReceipt.operator_name}</span></div>
                <div className="receipt-divider"></div>
                <div style={{ textAlign: 'center', fontWeight: 'bold' }}>Status: {renewalReceipt.status}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRenewalReceipt(null)}>Close</button>
              <button className="btn btn-success" onClick={handlePrintReceipt}>Print Renewal Receipt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
