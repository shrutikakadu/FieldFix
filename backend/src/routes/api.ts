import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/authMiddleware';
import { notifyBookingChange, notifyChatMessage } from '../services/realtime';

const router = Router();
const prisma = new PrismaClient();

const bookingInclude = {
  customer: true,
  technician: { include: { technicianProfile: true } },
  category: true,
  payment: true,
} as const;

const bookingUpdateSchema = z.object({
  address: z.string().trim().min(1).max(500).optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  description: z.string().trim().max(2000).optional(),
}).strict().refine(value => Object.keys(value).length > 0, 'Provide at least one booking field to update.');

const serializeBooking = (booking: any) => ({
  id: booking.id,
  customerId: booking.customerId,
  customerName: booking.customer.name,
  customerPhone: booking.customer.phone,
  service: booking.category.name,
  serviceType: booking.category.name,
  status: booking.status,
  technicianId: booking.technicianId,
  technicianName: booking.technician?.name || 'Unassigned',
  technicianPhone: booking.technician?.phone || '',
  technicianEmail: booking.technician?.email || '',
  technicianRating: booking.technician?.technicianProfile?.rating ?? 0,
  address: booking.address,
  description: booking.description,
  location: { lat: booking.latitude, lng: booking.longitude },
  amount: booking.totalAmount,
  totalAmount: booking.totalAmount,
  scheduledAt: booking.scheduledAt,
  scheduledTime: booking.scheduledAt,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt,
  paymentStatus: booking.payment?.status || 'UNPAID',
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'FieldFix REST API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Real Stats endpoint for Admin Dashboard
router.get('/stats', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const activeJobs = await prisma.booking.count({ where: { status: { in: ['IN_PROGRESS', 'DISPATCHED', 'ACCEPTED'] } } });
    const availableTechs = await prisma.technicianProfile.count({ where: { isAvailable: true } });
    const pendingRequests = await prisma.booking.count({ where: { status: 'PENDING' } });
    const todayCompleted = await prisma.booking.count({
      where: { status: 'COMPLETED', updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    });

    res.status(200).json({
      activeJobs,
      availableTechs,
      pendingRequests,
      todayCompleted
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Real Bookings list endpoint
router.get('/bookings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: req.user?.role === 'ADMIN'
        ? {}
        : req.user?.role === 'TECHNICIAN'
          ? { technicianId: req.user.id }
          : { customerId: req.user?.id },
      include: bookingInclude,
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(bookings.map(serializeBooking));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Read one booking while keeping the same customer/technician/admin visibility rules as the list.
router.get('/bookings/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: bookingInclude,
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (
      req.user!.role !== 'ADMIN' &&
      booking.customerId !== req.user!.id &&
      booking.technicianId !== req.user!.id
    ) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    res.json(serializeBooking(booking));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch booking.' });
  }
});

// Customers can adjust non-payment details only while the booking is awaiting payment.
router.patch('/bookings/:id', authMiddleware, requireRole('CUSTOMER'), async (req: AuthRequest, res: Response) => {
  const parsed = bookingUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Invalid booking update.' });
  }
  if (parsed.data.scheduledAt && new Date(parsed.data.scheduledAt) <= new Date()) {
    return res.status(400).json({ message: 'Appointment time must be in the future.' });
  }

  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id }, include: { payment: true } });
    if (!booking || booking.customerId !== req.user!.id) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    if (booking.status !== 'AWAITING_PAYMENT' || (booking.payment && booking.payment.status !== 'PENDING')) {
      return res.status(409).json({ message: 'Only bookings awaiting payment can be edited.' });
    }

    const updated = await prisma.booking.updateMany({
      where: { id: booking.id, customerId: req.user!.id, status: 'AWAITING_PAYMENT' },
      data: {
        ...(parsed.data.address !== undefined ? { address: parsed.data.address } : {}),
        ...(parsed.data.scheduledAt !== undefined ? { scheduledAt: new Date(parsed.data.scheduledAt) } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      },
    });
    if (updated.count !== 1) {
      return res.status(409).json({ message: 'Booking status changed; reload before editing.' });
    }

    const result = await prisma.booking.findUnique({ where: { id: booking.id }, include: bookingInclude });
    if (result) notifyBookingChange(result, 'Your booking details were updated.');
    return res.json(serializeBooking(result));
  } catch (error) {
    console.error('[API] Booking update error:', error);
    return res.status(500).json({ message: 'Failed to update booking.' });
  }
});

// Soft-delete unpaid bookings so payment and conversation history remain auditable.
router.delete('/bookings/:id', authMiddleware, requireRole('CUSTOMER'), async (req: AuthRequest, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id }, include: { payment: true } });
    if (!booking || booking.customerId !== req.user!.id) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    if (booking.status !== 'AWAITING_PAYMENT' || (booking.payment && booking.payment.status !== 'PENDING')) {
      return res.status(409).json({ message: 'Only bookings awaiting payment can be cancelled here.' });
    }

    const cancelled = await prisma.$transaction(async transaction => {
      const result = await transaction.booking.updateMany({
        where: { id: booking.id, customerId: req.user!.id, status: 'AWAITING_PAYMENT' },
        data: { status: 'CANCELLED' },
      });
      if (result.count !== 1) return false;
      await transaction.payment.updateMany({
        where: { bookingId: booking.id, status: 'PENDING' },
        data: { status: 'FAILED' },
      });
      return true;
    });
    if (!cancelled) {
      return res.status(409).json({ message: 'Booking status changed; reload before cancelling.' });
    }
    notifyBookingChange({ ...booking, status: 'CANCELLED' }, 'Your unpaid booking was cancelled.', { notifyTechnician: false });
    return res.json({ id: booking.id, status: 'CANCELLED' });
  } catch (error) {
    console.error('[API] Booking cancellation error:', error);
    return res.status(500).json({ message: 'Failed to cancel booking.' });
  }
});

router.patch('/bookings/:id/status', authMiddleware, requireRole('TECHNICIAN'), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['ACCEPTED'],
      ACCEPTED: ['IN_PROGRESS'],
      IN_PROGRESS: ['COMPLETED'],
    };
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking || booking.technicianId !== req.user!.id) {
      return res.status(404).json({ message: 'Booking not found for this technician.' });
    }
    if (!allowedTransitions[booking.status]?.includes(status)) {
      return res.status(409).json({ message: `Cannot change booking from ${booking.status} to ${status}.` });
    }

    const updated = await prisma.$transaction(async transaction => {
      const result = await transaction.booking.updateMany({
        where: { id: booking.id, technicianId: req.user!.id, status: booking.status },
        data: { status },
      });
      if (result.count !== 1) throw new Error('BOOKING_STATE_CHANGED');
      if (status === 'COMPLETED') {
        await transaction.technicianProfile.update({
          where: { userId: req.user!.id },
          data: { totalJobs: { increment: 1 } },
        });
      }
      return transaction.booking.findUniqueOrThrow({ where: { id: booking.id } });
    });

    notifyBookingChange(updated, `Job status changed to ${updated.status.toLowerCase().replaceAll('_', ' ')}.`);
    res.json({ id: updated.id, status: updated.status });
  } catch (error) {
    if (error instanceof Error && error.message === 'BOOKING_STATE_CHANGED') {
      return res.status(409).json({ message: 'Booking status changed; refresh before trying again.' });
    }
    console.error('[API] Booking status update error:', error);
    res.status(500).json({ message: 'Failed to update booking status.' });
  }
});

const canAccessThread = async (threadId: string, userId: string, role: string) => {
  if (role === 'ADMIN') return true;
  if (threadId === `support:${userId}`) return true;
  if (!threadId.startsWith('booking:')) return false;
  const booking = await prisma.booking.findUnique({ where: { id: threadId.slice('booking:'.length) } });
  return booking?.customerId === userId || booking?.technicianId === userId;
};

router.get('/messages/threads', authMiddleware, requireRole('ADMIN'), async (_req: AuthRequest, res: Response) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { OR: [
        { threadId: { startsWith: 'support:' } },
        { threadId: { startsWith: 'booking:' } },
      ] },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const userIds = [...new Set(messages
      .filter(message => message.threadId.startsWith('support:'))
      .map(message => message.threadId.slice('support:'.length)))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, role: true },
    });
    const usersById = new Map(users.map(user => [user.id, user]));
    const bookingIds = [...new Set(messages
      .filter(message => message.threadId.startsWith('booking:'))
      .map(message => message.threadId.slice('booking:'.length)))];
    const bookings = await prisma.booking.findMany({
      where: { id: { in: bookingIds } },
      include: { customer: { select: { name: true } }, technician: { select: { name: true } }, category: { select: { name: true } } },
    });
    const bookingsById = new Map(bookings.map(booking => [booking.id, booking]));
    const threads = new Map<string, any>();
    for (const message of messages) {
      if (!threads.has(message.threadId)) {
        const isSupport = message.threadId.startsWith('support:');
        const participantId = message.threadId.slice(isSupport ? 'support:'.length : 'booking:'.length);
        const participant = isSupport ? usersById.get(participantId) : undefined;
        const booking = isSupport ? undefined : bookingsById.get(participantId);
        threads.set(message.threadId, {
          threadId: message.threadId,
          participantId: participant?.id || booking?.customerId,
          participantName: participant?.name || (booking ? `${booking.customer.name} ↔ ${booking.technician?.name || 'Technician'} · ${booking.category.name}` : 'Deleted user'),
          participantRole: participant?.role || (booking ? 'BOOKING' : 'UNKNOWN'),
          lastMessage: message.body,
          updatedAt: message.createdAt,
        });
      }
    }
    res.json([...threads.values()]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load support inbox.' });
  }
});

const pushTokenSchema = z.object({
  token: z.string().min(10).max(512),
  platform: z.enum(['ios', 'android']),
}).strict();

router.post('/notifications/push-token', authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = pushTokenSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'A valid Expo push token and platform are required.' });
  try {
    const { token, platform } = parsed.data;
    await prisma.pushToken.upsert({
      where: { token },
      create: { token, platform, userId: req.user!.id },
      update: { platform, userId: req.user!.id },
    });
    res.status(201).json({ registered: true });
  } catch (error) {
    console.error('[API] Push token registration error:', error);
    res.status(500).json({ message: 'Could not register this device for notifications.' });
  }
});

router.delete('/notifications/push-token', authMiddleware, async (req: AuthRequest, res: Response) => {
  const token = String(req.body?.token || '');
  if (!token) return res.status(400).json({ message: 'Push token is required.' });
  try {
    await prisma.pushToken.deleteMany({ where: { token, userId: req.user!.id } });
    res.json({ removed: true });
  } catch (error) {
    res.status(500).json({ message: 'Could not unregister this device.' });
  }
});

router.get('/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const threadId = String(req.query.threadId || '');
    if (!threadId || !await canAccessThread(threadId, req.user!.id, req.user!.role)) {
      return res.status(403).json({ message: 'You do not have access to this conversation.' });
    }
    const messages = await prisma.chatMessage.findMany({
      where: { threadId },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load conversation.' });
  }
});

router.post('/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const threadId = String(req.body.threadId || '');
    const body = String(req.body.body || '').trim();
    if (!body || body.length > 2000) {
      return res.status(400).json({ message: 'Message must be between 1 and 2000 characters.' });
    }
    if (!threadId || !await canAccessThread(threadId, req.user!.id, req.user!.role)) {
      return res.status(403).json({ message: 'You do not have access to this conversation.' });
    }
    const message = await prisma.chatMessage.create({
      data: { threadId, senderId: req.user!.id, body },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });
    await notifyChatMessage(threadId, req.user!.id, message);
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message.' });
  }
});

export default router;
