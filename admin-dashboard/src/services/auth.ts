import { apiClient } from './api';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    technicianProfile?: any;
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
  role: string,
  technicianVerifiedId?: string,
  skills?: string[],
  city?: string,
): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/register', {
    name, email, phone, password, role,
    ...(technicianVerifiedId ? { technicianVerifiedId } : {}),
    ...(skills ? { skills } : {}),
    ...(city ? { city } : {}),
  });
  return response.data;
};

/** Fetch all technicians (optionally filtered by skill/city) */
export const getTechnicians = async (params?: { skill?: string; city?: string; name?: string; available?: boolean }) => {
  const queryStr = params
    ? '?' + Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
    : '';
  const response = await apiClient.get(`/auth/technicians${queryStr}`);
  return response.data.technicians as any[];
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
    try { return JSON.parse(userStr); }
    catch { return null; }
  }
  return null;
};

export const isAuthenticated = (): boolean => !!getStoredToken();
