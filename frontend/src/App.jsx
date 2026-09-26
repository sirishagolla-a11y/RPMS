import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ShiftManagement from './pages/ShiftManagement'
import VehicleEntry from './pages/VehicleEntry'
import VehicleRelease from './pages/VehicleRelease'
import Reports from './pages/Reports'
import VehicleHistory from './pages/VehicleHistory'
import VehicleSearch from './pages/VehicleSearch'
import MonthlyPass from './pages/MonthlyPass'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/shift-management" element={<ShiftManagement />} />
        <Route path="/vehicle-entry" element={<VehicleEntry />} />
        <Route path="/vehicle-release" element={<VehicleRelease />} />
        <Route path="/monthly-pass" element={<MonthlyPass />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/vehicle-history" element={<VehicleHistory />} />
        <Route path="/vehicle-search" element={<VehicleSearch />} />
      </Routes>
    </Layout>
  )
}

export default App
