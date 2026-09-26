import { useState, useEffect } from 'react'
import { fetchSessions } from '../services/api'

function VehicleHistory() {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const data = await fetchSessions()
      setSessions(data)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="page-card">
      <h2>Vehicle History log</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Overview of all past vehicle parking sessions.</p>

      <div className="premium-table-wrapper">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Receipt No</th>
              <th>Vehicle Number</th>
              <th>Type</th>
              <th>Entry Time</th>
              <th>Exit Time</th>
              <th>Fee</th>
              <th>Payment Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <tr key={session.id}>
                  <td>{session.receipt_number}</td>
                  <td style={{ fontWeight: 'bold' }}>{session.vehicle_number}</td>
                  <td>{session.vehicle_type}</td>
                  <td>{new Date(session.entry_time).toLocaleString()}</td>
                  <td>{session.exit_time ? new Date(session.exit_time).toLocaleString() : 'N/A'}</td>
                  <td>₹{session.parking_fee}</td>
                  <td>{session.payment_method || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${session.status === 'parked' ? 'pending' : 'active'}`}>
                      {session.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No session logs.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default VehicleHistory
