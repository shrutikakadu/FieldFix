import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_SERVER_URL = API_URL.replace(/\/api\/?$/, '');

export const socket: Socket = io(SOCKET_SERVER_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  auth: callback => callback({ token: localStorage.getItem('fieldfix_admin_token') }),
});

export const connectAuthenticatedSocket = () => {
  socket.auth = callback => callback({ token: localStorage.getItem('fieldfix_admin_token') });
  socket.connect();
};
