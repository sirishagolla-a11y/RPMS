import { useState, useEffect } from 'react'
import { fetchParkedSessions, releaseSession } from '../services/api'

function VehicleRelease() {
  const [parkedVehicles, setParkedVehicles] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState(null)

  useEffect(() => {
    loadParked()
  }, [])

  const loadParked = async () => {
    try {
      const data = await fetchParkedSessions()
      setParkedVehicles(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleRelease = async (e) => {
    e.preventDefault()
    if (!selectedSession) return
    setLoading(true)
    try {
      const data = await releaseSession(selectedSession.id, { payment_method: paymentMethod })
      setReceipt(data)
      setSelectedSession(null)
      loadParked()
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
      <div className="page-card">
        <h3>Currently Parked Vehicles</h3>
        <p style={{ color: 'var(--text-muted)' }}>Select a vehicle to process exit check-out.</p>

        <div className="premium-table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Vehicle Number</th>
                <th>Type</th>
                <th>Slot</th>
                <th>Entry Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {parkedVehicles.length > 0 ? (
                parkedVehicles.map((session) => (
                  <tr key={session.id}>
                    <td style={{ fontWeight: 'bold' }}>{session.vehicle_number}</td>
                    <td>{session.vehicle_type}</td>
                    <td>{session.parking_slot || 'N/A'}</td>
                    <td>{new Date(session.entry_time).toLocaleTimeString()}</td>
                    <td>
                      <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setSelectedSession(session)}>
                        Select
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    No vehicles currently parked.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {selectedSession && (
          <div className="page-card">
            <h3>Process Vehicle Exit</h3>
            <p>Vehicle: <strong>{selectedSession.vehicle_number}</strong> ({selectedSession.vehicle_type})</p>
            <p>Entry Time: <strong>{new Date(selectedSession.entry_time).toLocaleString()}</strong></p>

            <form onSubmit={handleRelease}>
              <div className="form-group">
                <label>Select Payment Method</label>
                {selectedSession.payment_method === 'FREE_MONTHLY' ? (
                  <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}>
                    <strong>Monthly Subscription Member (Free)</strong>
                  </div>
                ) : (
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                  </select>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>
                {loading ? 'Releasing...' : 'Release and Generate Receipt'}
              </button>
            </form>
          </div>
        )}

        {receipt && (
          <div className="page-card" style={{ border: '2px dashed #cbd5e1', background: '#ffffff' }}>
            <h4 style={{ textAlign: 'center', margin: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              RECEIPT SUMMARY
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Receipt No:</span>
                <strong>{receipt.receipt_number}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vehicle No:</span>
                <strong>{receipt.vehicle_number}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vehicle Type:</span>
                <strong>{receipt.vehicle_type}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Entry Time:</span>
                <span>{new Date(receipt.entry_time).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Exit Time:</span>
                <span>{new Date(receipt.exit_time).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Method:</span>
                <strong>{receipt.payment_method}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                <span>Total Charge:</span>
                <strong style={{ color: 'var(--success)' }}>₹{receipt.parking_fee}</strong>
              </div>
            </div>
            <button className="btn-secondary" style={{ width: '100%', marginTop: '16px' }} onClick={() => window.print()}>
              Print Receipt
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default VehicleRelease
