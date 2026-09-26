import { useState } from 'react'
import { fetchSessions } from '../services/api'

function VehicleSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query) return
    try {
      const data = await fetchSessions()
      const filtered = data.filter(s => s.vehicle_number.toLowerCase().includes(query.toLowerCase()))
      setResults(filtered)
      setSearched(true)
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="page-card">
      <h2>Search Vehicle Database</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Locate details of active parking sessions or past logs.</p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Enter Vehicle Number (e.g. AP39AB1234)..."
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
        />
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {searched && (
        <div className="premium-table-wrapper">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Vehicle Number</th>
                <th>Type</th>
                <th>Entry Time</th>
                <th>Exit Time</th>
                <th>Charge</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.length > 0 ? (
                results.map((session) => (
                  <tr key={session.id}>
                    <td>{session.receipt_number}</td>
                    <td style={{ fontWeight: 'bold' }}>{session.vehicle_number}</td>
                    <td>{session.vehicle_type}</td>
                    <td>{new Date(session.entry_time).toLocaleString()}</td>
                    <td>{session.exit_time ? new Date(session.exit_time).toLocaleString() : 'N/A'}</td>
                    <td>₹{session.parking_fee}</td>
                    <td>
                      <span className={`status-badge ${session.status === 'parked' ? 'pending' : 'active'}`}>
                        {session.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No matches found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default VehicleSearch
