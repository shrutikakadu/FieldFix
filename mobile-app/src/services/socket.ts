import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

export const connectSocket = (token: string): Socket => io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket'],
  auth: { token },
});
