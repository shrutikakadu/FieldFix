import { apiClient } from './api';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const loginAdmin = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (
  name: string,
  email: string,
  phone: string,
  password: string,
  role: string
): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/register', { name, email, phone, password, role });
  return response.data;
};

export const logoutAdmin = () => {
  localStorage.removeItem('fieldfix_admin_token');
  localStorage.removeItem('fieldfix_admin_user');
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem('fieldfix_admin_token');
};

export const getStoredUser = () => {
  const userStr = localStorage.getItem('fieldfix_admin_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};
