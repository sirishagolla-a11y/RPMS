import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Rates API
  getRates: async () => {
    const response = await apiClient.get('/rates/');
    return response.data;
  },

  // Shift API
  openShift: async (operatorName) => {
    const response = await apiClient.post('/shift/open/', { operator_name: operatorName });
    return response.data;
  },

  getCurrentShift: async () => {
    const response = await apiClient.get('/shift/current/');
    return response.data;
  },

  closeShift: async () => {
    const response = await apiClient.post('/shift/close/');
    return response.data;
  },

  // Parking API
  recordEntry: async (payload) => {
    const response = await apiClient.post('/parking/entry/', payload);
    return response.data;
  },

  searchParked: async (query = '') => {
    const response = await apiClient.get(`/parking/search/?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  releaseVehicle: async (recordId, paymentMethod) => {
    const response = await apiClient.post('/parking/release/', {
      record_id: recordId,
      payment_method: paymentMethod,
    });
    return response.data;
  },

  getHistory: async (query = '') => {
    const response = await apiClient.get(`/parking/history/?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Dashboard & Analytics
  getDashboardStats: async () => {
    const response = await apiClient.get('/dashboard/');
    return response.data;
  },

  // Monthly Pass API
  addMonthlyCustomer: async (payload) => {
    const response = await apiClient.post('/monthly-pass/add/', payload);
    return response.data;
  },

  getMonthlyCustomers: async () => {
    const response = await apiClient.get('/monthly-pass/');
    return response.data;
  },

  searchMonthlyCustomer: async (vehicleNumber) => {
    const response = await apiClient.get(`/monthly-pass/search/?vehicle_number=${encodeURIComponent(vehicleNumber)}`);
    return response.data;
  },

  updateMonthlyPayment: async (payload) => {
    const response = await apiClient.put('/monthly-pass/payment-update/', payload);
    return response.data;
  },

  sendMonthlyReminder: async (customerId) => {
    const response = await apiClient.post('/monthly-pass/send-reminder/', { customer_id: customerId });
    return response.data;
  },

  checkVehicle: async (vehicleNumber) => {
    const response = await apiClient.get(`/parking/check-vehicle/?vehicle_number=${encodeURIComponent(vehicleNumber)}`);
    return response.data;
  },

  renewMonthlyPass: async (payload) => {
    const response = await apiClient.post('/monthly-pass/renew/', payload);
    return response.data;
  },

  triggerDailyReminders: async () => {
    const response = await apiClient.post('/monthly-pass/trigger-reminders/');
    return response.data;
  },

};

export default apiService;
