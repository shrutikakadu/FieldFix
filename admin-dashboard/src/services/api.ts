import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('fieldfix_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
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

export const createBooking = async (booking: {
  technicianId: string;
  service: string;
  address: string;
  scheduledAt: string;
  description: string;
}) => (await apiClient.post('/bookings', booking)).data;

export const createPaymentOrder = async (booking: {
  technicianId: string;
  service: string;
  address: string;
  scheduledAt: string;
  description: string;
}) => (await apiClient.post('/payments/order', booking)).data;

export const verifyPayment = async (payment: {
  bookingId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}) => (await apiClient.post('/payments/verify', payment)).data;

export const failPayment = async (bookingId: string, orderId: string) =>
  (await apiClient.post('/payments/fail', { bookingId, orderId })).data;

export const updateBookingStatus = async (bookingId: string, status: string) =>
  (await apiClient.patch(`/bookings/${bookingId}/status`, { status })).data;

export const fetchMessages = async (threadId: string) =>
  (await apiClient.get('/messages', { params: { threadId } })).data;

export const sendMessage = async (threadId: string, body: string) =>
  (await apiClient.post('/messages', { threadId, body })).data;

export const fetchSupportThreads = async () =>
  (await apiClient.get('/messages/threads')).data;

export const updateTechnicianAvailability = async (isAvailable: boolean, technicianId?: string) =>
  (await apiClient.patch('/auth/technicians/availability', { isAvailable, ...(technicianId ? { technicianId } : {}) })).data;
