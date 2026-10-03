import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

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
      include: {
        customer: true,
        technician: { include: { technicianProfile: true } },
        category: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = bookings.map(b => ({
      id: b.id,
      customerId: b.customerId,
      customerName: b.customer.name,
      customerPhone: b.customer.phone,
      service: b.category.name,
      serviceType: b.category.name,
      status: b.status,
      technicianId: b.technicianId,
      technicianName: b.technician?.name || 'Unassigned',
      technicianPhone: b.technician?.phone || '',
      technicianEmail: b.technician?.email || '',
      technicianRating: b.technician?.technicianProfile?.rating ?? 0,
      address: b.address,
      description: b.description,
      location: { lat: b.latitude, lng: b.longitude },
      amount: b.totalAmount,
      totalAmount: b.totalAmount,
      scheduledAt: b.scheduledAt,
      scheduledTime: b.scheduledAt,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      paymentStatus: b.payment?.status || 'UNPAID',
    }));
    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
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
      const result = await transaction.booking.update({
        where: { id: booking.id },
        data: { status },
      });
      if (status === 'COMPLETED') {
        await transaction.technicianProfile.update({
          where: { userId: req.user!.id },
          data: { totalJobs: { increment: 1 } },
        });
      }
      return result;
    });

    res.json({ id: updated.id, status: updated.status });
  } catch (error) {
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
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message.' });
  }
});

export default router;
