import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO for real-time tracking, job status & chat
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Technician live location broadcast
  socket.on('location:update', (data: { technicianId: string; lat: number; lng: number; bookingId: string }) => {
    socket.to(`booking_${data.bookingId}`).emit('location:live', data);
  });

  // Join booking room for live updates
  socket.on('booking:join', (bookingId: string) => {
    socket.join(`booking_${bookingId}`);
    console.log(`[Socket.IO] Client ${socket.id} joined room booking_${bookingId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 FieldFix Backend server running on port ${PORT}`);
});
