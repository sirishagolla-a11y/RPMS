const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '')

export async function fetchVehicles() {
  const response = await fetch(`${API_BASE_URL}/vehicles/`)
  if (!response.ok) throw new Error('Failed to fetch vehicles')
  return response.json()
}

// Parking Sessions
export async function fetchSessions() {
  const response = await fetch(`${API_BASE_URL}/sessions/`)
  if (!response.ok) throw new Error('Failed to fetch sessions')
  return response.json()
}

export async function fetchParkedSessions() {
  const response = await fetch(`${API_BASE_URL}/sessions/parked/`)
  if (!response.ok) throw new Error('Failed to fetch parked vehicles')
  return response.json()
}

export async function checkEntry(data) {
  const response = await fetch(`${API_BASE_URL}/sessions/check_entry/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Failed to check in vehicle')
  }
  return response.json()
}

export async function releaseSession(id, data) {
  const response = await fetch(`${API_BASE_URL}/sessions/${id}/release/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Failed to release vehicle')
  }
  return response.json()
}

// Monthly Passes
export async function fetchPasses() {
  const response = await fetch(`${API_BASE_URL}/passes/`)
  if (!response.ok) throw new Error('Failed to fetch monthly passes')
  return response.json()
}

export async function createPass(data) {
  const response = await fetch(`${API_BASE_URL}/passes/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Failed to create monthly pass')
  }
  return response.json()
}

export async function updatePass(id, data) {
  const response = await fetch(`${API_BASE_URL}/passes/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Failed to update monthly pass')
  return response.json()
}

export async function deletePass(id) {
  const response = await fetch(`${API_BASE_URL}/passes/${id}/`, {
    method: 'DELETE'
  })
  if (!response.ok) throw new Error('Failed to delete monthly pass')
  return true
}

export async function renewPass(id, data) {
  const response = await fetch(`${API_BASE_URL}/passes/${id}/renew/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Failed to renew monthly pass')
  return response.json()
}

export async function fetchPassPayments(id) {
  const response = await fetch(`${API_BASE_URL}/passes/${id}/payments/`)
  if (!response.ok) throw new Error('Failed to fetch payment history')
  return response.json()
}

// Dashboard
export async function fetchDashboardStats() {
  const response = await fetch(`${API_BASE_URL}/dashboard/`)
  if (!response.ok) throw new Error('Failed to fetch dashboard stats')
  return response.json()
}

// Shifts
export async function fetchActiveShift() {
  const response = await fetch(`${API_BASE_URL}/shifts/active/`)
  if (!response.ok) throw new Error('Failed to fetch shift status')
  return response.json()
}

export async function openShift(operatorName) {
  const response = await fetch(`${API_BASE_URL}/shifts/open_shift/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operator_name: operatorName })
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Failed to open shift')
  }
  return response.json()
}

export async function closeShift(id) {
  const response = await fetch(`${API_BASE_URL}/shifts/${id}/close_shift/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  if (!response.ok) throw new Error('Failed to close shift')
  return response.json()
}

// Reports
export async function fetchReports(period = 'today', startDate = '', endDate = '') {
  let url = `${API_BASE_URL}/reports/?period=${period}`
  if (period === 'custom') {
    if (startDate) url += `&start_date=${startDate}`
    if (endDate) url += `&end_date=${endDate}`
  }
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch reports')
  return response.json()
}

// WhatsApp Reminders
export async function fetchExpiringPassesSummary() {
  const response = await fetch(`${API_BASE_URL}/passes/expiring_summary/`)
  if (!response.ok) throw new Error('Failed to fetch expiring passes summary')
  return response.json()
}

export async function sendSingleWhatsAppReminder(passId, reminderType = 'MANUAL', force = true) {
  const response = await fetch(`${API_BASE_URL}/passes/${passId}/send_whatsapp_reminder/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reminder_type: reminderType, force: force })
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.message || err.error || 'Failed to send WhatsApp reminder')
  }
  return response.json()
}

export async function sendDueWhatsAppReminders() {
  const response = await fetch(`${API_BASE_URL}/passes/send_due_reminders/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  if (!response.ok) throw new Error('Failed to send due WhatsApp reminders')
  return response.json()
}

export async function fetchReminderHistory() {
  const response = await fetch(`${API_BASE_URL}/passes/reminder_history/`)
  if (!response.ok) throw new Error('Failed to fetch reminder history')
  return response.json()
}

export async function testWhatsAppApiConfig() {
  const response = await fetch(`${API_BASE_URL}/passes/test_whatsapp/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  if (!response.ok) throw new Error('Failed to test WhatsApp configuration')
  return response.json()
}
