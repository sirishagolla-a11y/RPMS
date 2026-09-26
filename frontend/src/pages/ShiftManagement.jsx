import { useState, useEffect } from 'react'
import { fetchActiveShift, openShift, closeShift } from '../services/api'

function ShiftManagement() {
  const [activeShift, setActiveShift] = useState(null)
  const [operatorName, setOperatorName] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  const [closedSummary, setClosedSummary] = useState(null)

  useEffect(() => {
    loadShiftStatus()
  }, [])

  const loadShiftStatus = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const data = await fetchActiveShift()
      if (data && data.status === 'OPEN') {
        setActiveShift(data)
      } else {
        setActiveShift(null)
      }
    } catch (err) {
      setErrorMsg('Could not connect to backend server. Make sure Django server is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenShift = async (e) => {
    e.preventDefault()
    if (!operatorName.trim()) return
    setErrorMsg(null)
    setClosedSummary(null)
    try {
      const data = await openShift(operatorName.trim())
      setActiveShift(data)
      setOperatorName('')
    } catch (err) {
      setErrorMsg(err.message || 'Failed to open shift.')
    }
  }

  const handleCloseShift = async () => {
    if (!activeShift) return
    if (!window.confirm(`Close shift for operator ${activeShift.operator_name}?`)) return
    setErrorMsg(null)
    try {
      const summary = await closeShift(activeShift.id)
      setClosedSummary(summary)
      setActiveShift(null)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to close shift.')
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-card">
        <h2>Shift Management</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Manage operator duty shifts, active sessions, and cash handovers.</p>

        {errorMsg && (
          <div style={{
            padding: '16px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            marginBottom: '24px'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading shift status...</p>
        ) : activeShift ? (
          <div style={{
            padding: '24px',
            borderRadius: '14px',
            background: '#f0fdf4',
            border: '1.5px solid #86efac',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="status-badge active" style={{ marginBottom: '8px' }}>SHIFT OPEN</span>
                <h3 style={{ margin: '4px 0', color: '#14532d' }}>Operator: {activeShift.operator_name}</h3>
                <span style={{ fontSize: '0.9rem', color: '#166534', fontWeight: '600' }}>
                  Started at: {new Date(activeShift.start_time).toLocaleString()}
                </span>
              </div>
              <button className="btn-secondary" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', background: '#ffffff' }} onClick={handleCloseShift}>
                Close Shift
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              padding: '16px',
              borderRadius: '10px',
              background: '#fffbe6',
              border: '1.5px solid #ffe58f',
              color: '#d46b08',
              fontWeight: '600',
              marginBottom: '24px'
            }}>
              ⚠️ Shift Closed! Please open an operator shift to start recording parking operations.
            </div>

            <form onSubmit={handleOpenShift}>
              <div className="form-group">
                <label>Operator Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Enter operator name (e.g. Operator 1)..."
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Open New Shift
              </button>
            </form>
          </div>
        )}
      </div>

      {closedSummary && (
        <div className="page-card" style={{ border: '2px dashed #cbd5e1', background: '#ffffff' }}>
          <h4 style={{ textAlign: 'center', margin: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            SHIFT HANDOVER SUMMARY
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Operator:</span>
              <strong>{closedSummary.operator_name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Shift Duration:</span>
              <span>{new Date(closedSummary.start_time).toLocaleTimeString()} - {new Date(closedSummary.end_time).toLocaleTimeString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Entries Processed:</span>
              <strong>{closedSummary.total_entries}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Exits Processed:</span>
              <strong>{closedSummary.total_exits}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
              <span>Total Revenue Handover:</span>
              <strong style={{ color: 'var(--success)' }}>₹{closedSummary.total_revenue}</strong>
            </div>
          </div>
          <button className="btn-secondary" style={{ width: '100%', marginTop: '16px' }} onClick={() => window.print()}>
            Print Shift Summary
          </button>
        </div>
      )}
    </div>
  )
}

export default ShiftManagement
