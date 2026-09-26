import { useState } from 'react'
import { checkEntry } from '../services/api'

function VehicleEntry() {
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: 'Car',
    driver_name: '',
    parking_slot: ''
  })
  const [loading, setLoading] = useState(false)
  const [responseMsg, setResponseMsg] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResponseMsg(null)
    setErrorMsg(null)
    try {
      const data = await checkEntry(formData)
      setResponseMsg(data)
      setFormData({
        vehicle_number: '',
        vehicle_type: 'Car',
        driver_name: '',
        parking_slot: ''
      })
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>Vehicle Entry Check-In</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Register casual parking or process monthly passes immediately.</p>

      {responseMsg && (
        <div style={{
          padding: '16px',
          borderRadius: '10px',
          background: responseMsg.is_monthly ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
          border: responseMsg.is_monthly ? '1px solid var(--success)' : '1px solid var(--accent-primary)',
          color: responseMsg.is_monthly ? 'var(--success)' : 'var(--text-main)',
          marginBottom: '24px'
        }}>
          <h4 style={{ margin: '0 0 8px 0' }}>
            {responseMsg.is_monthly ? '🎉 Monthly Pass Active!' : '✅ Check-In Recorded'}
          </h4>
          <p style={{ margin: '0 0 6px 0' }}>Receipt Number: <strong>{responseMsg.session.receipt_number}</strong></p>
          <p style={{ margin: '0 0 6px 0' }}>Vehicle: <strong>{responseMsg.session.vehicle_number}</strong> ({responseMsg.session.vehicle_type})</p>
          <p style={{ margin: '0' }}>Parking Fee: <strong>₹0.00 (Monthly Member)</strong></p>
        </div>
      )}

      {errorMsg && (
        <div style={{
          padding: '16px',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid var(--danger)',
          color: 'var(--danger)',
          marginBottom: '24px'
        }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Vehicle Number</label>
          <input
            type="text"
            required
            className="form-input"
            placeholder="e.g. AP39AB1234"
            value={formData.vehicle_number}
            onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
          />
        </div>

        <div className="form-group">
          <label>Vehicle Type</label>
          <select
            className="form-select"
            value={formData.vehicle_type}
            onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
          >
            <option value="Car">Car / SUV</option>
            <option value="Bike">Bike / Two Wheeler</option>
            <option value="Truck">Truck / Bus</option>
          </select>
        </div>

        <div className="form-group">
          <label>Driver / Owner Name (Optional)</label>
          <input
            type="text"
            className="form-input"
            value={formData.driver_name}
            onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Parking Slot (Optional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Slot-4"
            value={formData.parking_slot}
            onChange={(e) => setFormData({ ...formData, parking_slot: e.target.value })}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '12px' }}>
          {loading ? 'Processing Check-In...' : 'Record Vehicle Entry'}
        </button>
      </form>
    </div>
  )
}

export default VehicleEntry
