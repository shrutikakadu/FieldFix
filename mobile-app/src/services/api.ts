import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api');

const TOKEN_KEY = 'fieldfix_auth_token';
export const apiClient = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

export const getAuthToken = async () => {
  if (Platform.OS === 'web') return localStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const saveAuthToken = async (token: string) => {
  if (Platform.OS === 'web') localStorage.setItem(TOKEN_KEY, token);
  else await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const clearAuthToken = async () => {
  if (Platform.OS === 'web') localStorage.removeItem(TOKEN_KEY);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
};

apiClient.interceptors.request.use(async config => {
  const token = await getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type User = {
  id: string; name: string; email: string; role: 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';
  phone?: string; technicianProfile?: any;
};

export const getHealthCheck = async () => (await apiClient.get('/health')).data;
export const login = async (email: string, password: string) => (await apiClient.post('/auth/login', { email, password })).data;
export const register = async (input: Record<string, unknown>) => (await apiClient.post('/auth/register', input)).data;
export const getMe = async () => (await apiClient.get('/auth/me')).data.user as User;
export const getBookings = async () => (await apiClient.get('/bookings')).data;
export const matchTechnician = async (service: string, city: string) =>
  (await apiClient.post('/dispatch/match', { service, city })).data.technician;
export const createPaymentOrder = async (details: {
  service: string; city: string; address: string; scheduledAt: string;
  description: string; latitude: number; longitude: number;
}) => (await apiClient.post('/payments/order', details)).data;
export const verifyPayment = async (details: {
  bookingId: string; orderId: string; paymentId: string; signature: string;
}) => (await apiClient.post('/payments/verify', details)).data;
export const failPayment = async (bookingId: string, orderId: string) =>
  (await apiClient.post('/payments/fail', { bookingId, orderId })).data;
export const updateBookingStatus = async (bookingId: string, status: string) =>
  (await apiClient.patch(`/bookings/${bookingId}/status`, { status })).data;
export const updateAvailability = async (isAvailable: boolean) =>
  (await apiClient.patch('/auth/technicians/availability', { isAvailable })).data;
export const getMessages = async (threadId: string) =>
  (await apiClient.get('/messages', { params: { threadId } })).data;
export const postMessage = async (threadId: string, body: string) =>
  (await apiClient.post('/messages', { threadId, body })).data;
export const registerPushToken = async (token: string, platform: 'ios' | 'android') =>
  (await apiClient.post('/notifications/push-token', { token, platform })).data;
export const unregisterPushToken = async (token: string) =>
  (await apiClient.delete('/notifications/push-token', { data: { token } })).data;
