import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import app from './app';
import { getJwtSecret } from './authConfig';
import { setRealtimeServer, threadRoom } from './services/realtime';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);
const prisma = new PrismaClient();

// Attach Socket.IO for real-time tracking, job status & chat
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setRealtimeServer(io, prisma);

io.use(async (socket, next) => {
  try {
    const rawToken = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (typeof rawToken !== 'string') return next(new Error('Authentication required.'));
    const decoded = jwt.verify(rawToken, getJwtSecret());
    if (typeof decoded === 'string' || typeof decoded.id !== 'string') return next(new Error('Invalid token.'));
    const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { id: true, role: true } });
    if (!user || user.role !== decoded.role) return next(new Error('Account is no longer available.'));
    socket.data.user = user;
    next();
  } catch {
    next(new Error('Socket authentication failed.'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data.user as { id: string; role: string };
  socket.join(`user_${user.id}`);

  socket.on('location:update', async (payload: unknown) => {
    if (user.role !== 'TECHNICIAN') return;
    const parsed = z.object({ bookingId: z.string().min(1), lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).safeParse(payload);
    if (!parsed.success) return;
    const booking = await prisma.booking.findFirst({ where: { id: parsed.data.bookingId, technicianId: user.id, status: { in: ['ACCEPTED', 'DISPATCHED', 'IN_PROGRESS'] } }, select: { id: true } });
    if (!booking) return;
    await prisma.technicianProfile.updateMany({ where: { userId: user.id }, data: { currentLat: parsed.data.lat, currentLng: parsed.data.lng } });
    io.to(`booking_${booking.id}`).emit('location:live', { technicianId: user.id, bookingId: booking.id, lat: parsed.data.lat, lng: parsed.data.lng });
  });

  socket.on('booking:join', async (bookingId: unknown) => {
    if (typeof bookingId !== 'string' || !bookingId) return;
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { customerId: true, technicianId: true } });
    if (user.role === 'ADMIN' || booking?.customerId === user.id || booking?.technicianId === user.id) {
      socket.join(`booking_${bookingId}`);
    }
  });

  socket.on('chat:join', async (threadId: unknown) => {
    if (typeof threadId !== 'string' || threadId.length > 200) return;
    let allowed = user.role === 'ADMIN' || threadId === `support:${user.id}`;
    if (!allowed && threadId.startsWith('booking:')) {
      const booking = await prisma.booking.findUnique({ where: { id: threadId.slice(8) }, select: { customerId: true, technicianId: true } });
      allowed = booking?.customerId === user.id || booking?.technicianId === user.id;
    }
    if (allowed) socket.join(threadRoom(threadId));
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 FieldFix Backend server running on port ${PORT}`);
});
