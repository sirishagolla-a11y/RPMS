import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { apiService } from './services/api';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ShiftManagement from './pages/ShiftManagement';
import VehicleEntry from './pages/VehicleEntry';
import VehicleRelease from './pages/VehicleRelease';
import VehicleSearch from './pages/VehicleSearch';
import VehicleHistory from './pages/VehicleHistory';
import Reports from './pages/Reports';
import MonthlyPass from './pages/MonthlyPass';

export default function App() {
  const [currentShift, setCurrentShift] = useState({ active: false, shift: null });

  useEffect(() => {
    fetchCurrentShift();
  }, []);

  const fetchCurrentShift = async () => {
    try {
      const data = await apiService.getCurrentShift();
      setCurrentShift(data);
    } catch (err) {
      console.error('Error fetching shift status:', err);
    }
  };

  return (
    <Router>
      <Layout currentShift={currentShift} onRefreshShift={fetchCurrentShift}>
        <Routes>
          <Route path="/" element={<Dashboard currentShift={currentShift} />} />
          <Route
            path="/shift"
            element={<ShiftManagement currentShift={currentShift} onRefreshShift={fetchCurrentShift} />}
          />
          <Route path="/entry" element={<VehicleEntry currentShift={currentShift} />} />
          <Route path="/release" element={<VehicleRelease currentShift={currentShift} />} />
          <Route path="/search" element={<VehicleSearch />} />
          <Route path="/history" element={<VehicleHistory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/monthly-pass" element={<MonthlyPass />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
