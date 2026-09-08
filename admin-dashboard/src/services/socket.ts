import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:5000';

export const socket: Socket = io(SOCKET_SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
