import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchDashboardStats = async () => {
  const response = await apiClient.get('/stats');
  return response.data;
};

export const fetchBookings = async () => {
  const response = await apiClient.get('/bookings');
  return response.data;
};

export const fetchHealthStatus = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};
