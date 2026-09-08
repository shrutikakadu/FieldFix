import axios from 'axios';
import { Platform } from 'react-native';

// For Android emulator, localhost is accessible via 10.0.2.2.
// For physical devices or web, use your local IP or localhost.
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

export const getHealthCheck = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('Mobile API health check failed:', error);
    return null;
  }
};
