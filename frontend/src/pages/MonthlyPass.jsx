import { useState, useEffect } from 'react'
import {
  fetchPasses,
  createPass,
  updatePass,
  deletePass,
  renewPass,
  fetchPassPayments,
  fetchExpiringPassesSummary,
  sendSingleWhatsAppReminder,
  sendDueWhatsAppReminders,
  fetchReminderHistory,
  testWhatsAppApiConfig
} from '../services/api'

function MonthlyPass() {
  const [activeTab, setActiveTab] = useState('customers') // 'customers' | 'whatsapp'
  const [passes, setPasses] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPass, setSelectedPass] = useState(null)
  const [payments, setPayments] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [showPaymentsModal, setShowPaymentsModal] = useState(false)

  // WhatsApp Tab State
  const [expiringSummary, setExpiringSummary] = useState([])
  const [reminderHistory, setReminderHistory] = useState([])
  const [whatsappStatus, setWhatsappStatus] = useState(null)
  const [sendingReminderId, setSendingReminderId] = useState(null)
  const [batchSending, setBatchSending] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: 'Car',
    owner_name: '',
    phone_number: '',
    whatsapp_number: '',
    start_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    monthly_fee: 300,
    status: 'ACTIVE',
    address: ''
  })

  const [renewData, setRenewData] = useState({
    start_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    amount: 300,
    payment_status: 'PAID',
    transaction_details: 'Pass Renewal'
  })

  useEffect(() => {
    loadPasses()
    if (activeTab === 'whatsapp') {
      loadWhatsAppTab()
    }
  }, [activeTab])

  const loadPasses = async () => {
    try {
      const data = await fetchPasses()
      setPasses(data)
    } catch (err) {
      alert(err.message)
    }
  }

  const loadWhatsAppTab = async () => {
    try {
      const summary = await fetchExpiringPassesSummary()
      const history = await fetchReminderHistory()
      const statusRes = await testWhatsAppApiConfig()
      setExpiringSummary(summary)
      setReminderHistory(history)
      setWhatsappStatus(statusRes)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSendSingleReminder = async (passId) => {
    setSendingReminderId(passId)
    try {
      const res = await sendSingleWhatsAppReminder(passId, 'MANUAL', true)
      alert(res.message || `WhatsApp Reminder status: ${res.status}`)
      loadWhatsAppTab()
    } catch (err) {
      alert(err.message)
    } finally {
      setSendingReminderId(null)
    }
  }

  const handleSendDueReminders = async () => {
    setBatchSending(true)
    try {
      const res = await sendDueWhatsAppReminders()
      alert(`Batch Expiry Scan Complete!\nProcessed: ${res.processed}\nSent: ${res.sent}\nSkipped (Already Sent Today): ${res.already_sent}`)
      loadWhatsAppTab()
    } catch (err) {
      alert(err.message)
    } finally {
      setBatchSending(false)
    }
  }

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault()
    try {
      if (selectedPass && !showRenewModal) {
        await updatePass(selectedPass.id, formData)
        alert('Pass updated successfully!')
      } else {
        await createPass(formData)
        alert('Monthly Pass created successfully!')
      }
      loadPasses()
      setShowAddModal(false)
      setSelectedPass(null)
      resetForm()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this pass?')) {
      try {
        await deletePass(id)
        alert('Pass deleted successfully!')
        loadPasses()
      } catch (err) {
        alert(err.message)
      }
    }
  }

  const handleRenew = async (e) => {
    e.preventDefault()
    try {
      await renewPass(selectedPass.id, renewData)
      alert('Pass renewed successfully!')
      loadPasses()
      setShowRenewModal(false)
      setSelectedPass(null)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleViewPayments = async (pass) => {
    try {
      const data = await fetchPassPayments(pass.id)
      setPayments(data)
      setSelectedPass(pass)
      setShowPaymentsModal(true)
    } catch (err) {
      alert(err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      vehicle_number: '',
      vehicle_type: 'Car',
      owner_name: '',
      phone_number: '',
      whatsapp_number: '',
      start_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      monthly_fee: 300,
      status: 'ACTIVE',
      address: ''
    })
  }

  const openEditModal = (pass) => {
    setSelectedPass(pass)
    setFormData({
      vehicle_number: pass.vehicle_number,
      vehicle_type: pass.vehicle_type,
      owner_name: pass.owner_name,
      phone_number: pass.phone_number,
      whatsapp_number: pass.whatsapp_number,
      start_date: pass.start_date,
      expiry_date: pass.expiry_date,
      monthly_fee: pass.monthly_fee,
      status: pass.status,
      address: pass.address || ''
    })
    setShowAddModal(true)
  }

  const openRenewModal = (pass) => {
    setSelectedPass(pass)
    setRenewData({
      start_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      amount: pass.monthly_fee,
      payment_status: 'PAID',
      transaction_details: 'Pass Renewal'
    })
    setShowRenewModal(true)
  }

  const filteredPasses = passes.filter(pass =>
    pass.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pass.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pass.phone_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="page-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Monthly Subscriptions & Pass Management</h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage customer profiles, renewals, and WhatsApp expiry notifications.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className={activeTab === 'customers' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('customers')}
          >
            📋 Monthly Customers
          </button>
          <button
            className={activeTab === 'whatsapp' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('whatsapp')}
          >
            💬 WhatsApp Reminders
          </button>
        </div>
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'customers' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <input
              type="text"
              className="form-input"
              style={{ maxWidth: '400px' }}
              placeholder="Search by Vehicle Number, Owner Name, or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn-primary" onClick={() => { setSelectedPass(null); resetForm(); setShowAddModal(true); }}>
              + Add Customer
            </button>
          </div>

          <div className="premium-table-wrapper">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Owner Name</th>
                  <th>Vehicle Number</th>
                  <th>Type</th>
                  <th>Phone</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPasses.length > 0 ? (
                  filteredPasses.map((pass) => (
                    <tr key={pass.id}>
                      <td>{pass.owner_name}</td>
                      <td style={{ fontWeight: 'bold' }}>{pass.vehicle_number}</td>
                      <td>{pass.vehicle_type}</td>
                      <td>{pass.phone_number}</td>
                      <td>{pass.expiry_date}</td>
                      <td>
                        <span className={`status-badge ${pass.status.toLowerCase()}`}>
                          {pass.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => openEditModal(pass)}>
                            Edit
                          </button>
                          <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => openRenewModal(pass)}>
                            Renew
                          </button>
                          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleViewPayments(pass)}>
                            Payments
                          </button>
                          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--danger)', borderColor: '#fca5a5' }} onClick={() => handleDelete(pass.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No monthly passes found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* WHATSAPP REMINDERS TAB */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Status Header & Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div>
              <span className={`status-badge ${whatsappStatus?.configured ? 'active' : 'pending'}`}>
                {whatsappStatus?.status || 'Checking Meta API Config...'}
              </span>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Official Meta WhatsApp Business Cloud API Architecture (v19.0)
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-primary" style={{ background: '#16a34a' }} onClick={handleSendDueReminders} disabled={batchSending}>
                📲 {batchSending ? 'Scanning...' : 'Send Due Reminders (7d / 3d / 1d)'}
              </button>
            </div>
          </div>

          {/* Expiring Customers Table */}
          <div>
            <h3 style={{ margin: '0 0 12px 0' }}>⚠️ Customers Expiring Soon (Within 7 Days)</h3>
            <div className="premium-table-wrapper">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Vehicle Number</th>
                    <th>WhatsApp Phone</th>
                    <th>Expiry Date</th>
                    <th>Days Remaining</th>
                    <th>Last Reminder Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringSummary.length > 0 ? (
                    expiringSummary.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 'bold' }}>{item.owner_name}</td>
                        <td>{item.vehicle_number}</td>
                        <td>{item.phone_number}</td>
                        <td>{item.expiry_date}</td>
                        <td>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: item.days_remaining <= 3 ? '#fee2e2' : '#fef3c7',
                            color: item.days_remaining <= 3 ? '#b91c1c' : '#b45309',
                            fontWeight: '700'
                          }}>
                            {item.days_remaining} {item.days_remaining === 1 ? 'day' : 'days'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${item.last_reminder_status.toLowerCase()}`}>
                            {item.last_reminder_status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-primary"
                            style={{ padding: '6px 14px', fontSize: '0.85rem', background: '#2563eb' }}
                            onClick={() => handleSendSingleReminder(item.id)}
                            disabled={sendingReminderId === item.id}
                          >
                            {sendingReminderId === item.id ? 'Sending...' : 'Send Reminder'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No passes expiring in the next 7 days.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Reminder Audit Log History */}
          <div>
            <h3 style={{ margin: '0 0 12px 0' }}>📜 Recent WhatsApp Reminder History Logs</h3>
            <div className="premium-table-wrapper" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Sent Date</th>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Message Snippet</th>
                    <th>WhatsApp Message ID / Error</th>
                  </tr>
                </thead>
                <tbody>
                  {reminderHistory.length > 0 ? (
                    reminderHistory.map((log) => (
                      <tr key={log.id}>
                        <td>{log.sent_date}</td>
                        <td style={{ fontWeight: 'bold' }}>Pass #{log.pass_record}</td>
                        <td>{log.reminder_type}</td>
                        <td>
                          <span className={`status-badge ${log.reminder_status === 'SENT' ? 'active' : log.reminder_status === 'SIMULATED' ? 'pending' : 'expired'}`}>
                            {log.reminder_status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: '#475569' }}>{log.message.substring(0, 50)}...</td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {log.whatsapp_message_id || log.error_message || 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No reminder logs registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="modal-backdrop" style={modalBackdropStyle}>
          <div className="page-card" style={modalContentStyle}>
            <h3>{selectedPass ? 'Edit Customer Details' : 'Add Monthly Customer'}</h3>
            <form onSubmit={handleCreateOrUpdate}>
              <div style={grid2Col}>
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input
                    type="text"
                    required
                    disabled={!!selectedPass}
                    className="form-input"
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
              </div>

              <div style={grid2Col}>
                <div className="form-group">
                  <label>Owner Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  />
                </div>
              </div>

              <div style={grid2Col}>
                <div className="form-group">
                  <label>WhatsApp Number</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Monthly Fee (₹)</label>
                  <input
                    type="number"
                    required
                    className="form-input"
                    value={formData.monthly_fee}
                    onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
                  />
                </div>
              </div>

              <div style={grid2Col}>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address (Optional)</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                ></textarea>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING">PENDING</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Pass Modal */}
      {showRenewModal && (
        <div className="modal-backdrop" style={modalBackdropStyle}>
          <div className="page-card" style={modalContentStyle}>
            <h3>Renew Monthly Pass ({selectedPass?.vehicle_number})</h3>
            <form onSubmit={handleRenew}>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={renewData.start_date}
                  onChange={(e) => setRenewData({ ...renewData, start_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>New Expiry Date</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={renewData.expiry_date}
                  onChange={(e) => setRenewData({ ...renewData, expiry_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Renewal Amount (₹)</label>
                <input
                  type="number"
                  required
                  className="form-input"
                  value={renewData.amount}
                  onChange={(e) => setRenewData({ ...renewData, amount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Payment Status</label>
                <select
                  className="form-select"
                  value={renewData.payment_status}
                  onChange={(e) => setRenewData({ ...renewData, payment_status: e.target.value })}
                >
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>

              <div className="form-group">
                <label>Transaction Details</label>
                <input
                  type="text"
                  className="form-input"
                  value={renewData.transaction_details}
                  onChange={(e) => setRenewData({ ...renewData, transaction_details: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowRenewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Renew Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentsModal && (
        <div className="modal-backdrop" style={modalBackdropStyle}>
          <div className="page-card" style={{ ...modalContentStyle, maxWidth: '700px' }}>
            <h3>Payment History for {selectedPass?.vehicle_number}</h3>
            <div className="premium-table-wrapper" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Payment Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Renewal Until</th>
                    <th>Transaction Details</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length > 0 ? (
                    payments.map((pay) => (
                      <tr key={pay.id}>
                        <td>{pay.payment_date}</td>
                        <td style={{ fontWeight: 'bold' }}>₹{pay.amount}</td>
                        <td>
                          <span className={`status-badge ${pay.payment_status.toLowerCase()}`}>
                            {pay.payment_status}
                          </span>
                        </td>
                        <td>{pay.renewal_date}</td>
                        <td>{pay.transaction_details}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No payment records.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowPaymentsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const modalBackdropStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
}

const modalContentStyle = {
  width: '100%',
  maxWidth: '550px',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: '#ffffff',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
}

const grid2Col = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px'
}

export default MonthlyPass
