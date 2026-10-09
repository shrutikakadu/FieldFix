import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/authMiddleware';
import { findDispatchCandidate } from '../services/dispatchService';
import { notifyBookingChange } from '../services/realtime';

const router = Router();
const prisma = new PrismaClient();
const orderSchema = z.object({
  technicianId: z.string().min(1).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  service: z.string().trim().min(1).max(100),
  address: z.string().trim().min(1).max(500),
  scheduledAt: z.string().datetime({ offset: true }),
  description: z.string().trim().max(2000).optional().default(''),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).strict();

const verifySchema = z.object({
  bookingId: z.string().min(1),
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().regex(/^[a-f\d]{64}$/i),
}).strict();

const failSchema = z.object({
  bookingId: z.string().min(1),
  orderId: z.string().min(1),
}).strict();
const servicePrices: Record<string, number> = {
  'AC & Cooling': 599,
  Electrical: 449,
  Plumbing: 399,
  Appliances: 349,
  Cleaning: 499,
  Carpentry: 549,
  Painting: 1499,
  'Pest Control': 899,
  'Smart Home': 999,
  'Geyser & Water': 449,
};

const razorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error('Razorpay is not configured on the server.');
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

router.post('/order', authMiddleware, requireRole('CUSTOMER'), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = orderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Invalid booking details.' });
    }
    const { service: serviceName, address: serviceAddress, scheduledAt, description, city, latitude, longitude } = parsed.data;
    const amount = servicePrices[serviceName];
    const appointment = new Date(scheduledAt);
    if (!amount || appointment <= new Date()) {
      return res.status(400).json({ message: 'Choose a valid service and future appointment time.' });
    }

    let technicianId = parsed.data.technicianId;
    if (!technicianId) {
      if (!city) {
        return res.status(400).json({ message: 'City is required when requesting automatic technician matching.' });
      }
      const candidate = await findDispatchCandidate(prisma, serviceName, city);
      if (!candidate) {
        return res.status(404).json({ message: 'No available technician offers this service in that city.' });
      }
      technicianId = candidate.id;
    }

    const technician = await prisma.user.findFirst({
      where: { id: technicianId, role: 'TECHNICIAN', technicianProfile: { isAvailable: true } },
      include: { technicianProfile: true },
    });
    if (!technician?.technicianProfile) {
      return res.status(404).json({ message: 'This technician is not available for bookings.' });
    }
    let skills: string[] = [];
    try {
      skills = JSON.parse(technician.technicianProfile.skills);
    } catch {
      skills = [];
    }
    if (!skills.includes(serviceName)) {
      return res.status(400).json({ message: 'This technician does not offer the selected service.' });
    }

    const category = await prisma.serviceCategory.upsert({
      where: { name: serviceName },
      update: { basePrice: amount },
      create: { name: serviceName, basePrice: amount },
    });
    const bookingId = randomUUID();
    const keyId = process.env.RAZORPAY_KEY_ID;
    const gateway = razorpayClient();
    const order = await gateway.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: bookingId.replaceAll('-', ''),
      notes: { bookingId, customerId: req.user!.id },
    });

    await prisma.$transaction(async transaction => {
      await transaction.booking.create({
        data: {
          id: bookingId,
          customerId: req.user!.id,
          technicianId: technician.id,
          categoryId: category.id,
          address: serviceAddress,
          latitude: latitude ?? 12.9716,
          longitude: longitude ?? 77.5946,
          scheduledAt: appointment,
          totalAmount: amount,
          description: String(description || '').trim(),
          status: 'AWAITING_PAYMENT',
        },
      });
      await transaction.payment.create({
        data: {
          bookingId,
          amount,
          provider: 'RAZORPAY',
          transactionId: order.id,
          status: 'PENDING',
        },
      });
    });

    res.status(201).json({
      bookingId,
      orderId: order.id,
      keyId,
      amount: order.amount,
      currency: order.currency,
      customer: { name: req.user!.email },
      technician: { id: technician.id, name: technician.name, city: technician.technicianProfile.city },
    });
  } catch (error) {
    console.error('[Payments] Order creation failed:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Could not start payment.' });
  }
});

router.post('/verify', authMiddleware, requireRole('CUSTOMER'), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Razorpay payment details are incomplete or invalid.' });
    }
    const { bookingId, orderId, paymentId, signature } = parsed.data;
    const pending = await prisma.payment.findFirst({
      where: {
        bookingId,
        transactionId: orderId,
        provider: 'RAZORPAY',
        status: 'PENDING',
        booking: { customerId: req.user!.id, status: 'AWAITING_PAYMENT' },
      },
      include: { booking: { include: { customer: true, technician: true, category: true } } },
    });
    if (!pending) return res.status(404).json({ message: 'Pending payment order not found.' });

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return res.status(503).json({ message: 'Razorpay is not configured on the server.' });
    const expectedSignature = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest();
    const submittedSignature = Buffer.from(String(signature), 'hex');
    if (submittedSignature.length !== expectedSignature.length || !timingSafeEqual(submittedSignature, expectedSignature)) {
      return res.status(400).json({ message: 'Payment signature could not be verified.' });
    }

    const gateway = razorpayClient();
    let gatewayPayment = await gateway.payments.fetch(paymentId);
    if (
      gatewayPayment.order_id !== orderId ||
      gatewayPayment.amount !== Math.round(pending.amount * 100) ||
      gatewayPayment.currency !== 'INR'
    ) {
      return res.status(400).json({ message: 'Payment does not match this booking.' });
    }
    if (gatewayPayment.status === 'authorized') {
      gatewayPayment = await gateway.payments.capture(paymentId, Math.round(pending.amount * 100), 'INR');
    }
    if (gatewayPayment.status !== 'captured') {
      return res.status(402).json({ message: 'Razorpay has not captured this payment.' });
    }

    const booking = await prisma.$transaction(async transaction => {
      const activated = await transaction.booking.updateMany({
        where: { id: bookingId, customerId: req.user!.id, status: 'AWAITING_PAYMENT' },
        data: { status: 'PENDING' },
      });
      if (activated.count !== 1) throw new Error('BOOKING_STATE_CHANGED');

      const paid = await transaction.payment.updateMany({
        where: { bookingId, transactionId: orderId, status: 'PENDING' },
        data: { transactionId: paymentId, status: 'PAID' },
      });
      if (paid.count !== 1) throw new Error('PAYMENT_STATE_CHANGED');

      return transaction.booking.findUniqueOrThrow({
        where: { id: bookingId },
        include: { customer: true, technician: true, category: true },
      });
    });

    notifyBookingChange(booking, 'Payment confirmed. Your technician has received the job.');

    res.json({
      id: booking.id,
      technicianId: booking.technicianId,
      technicianName: booking.technician?.name || '',
      technicianPhone: booking.technician?.phone || '',
      service: booking.category.name,
      address: booking.address,
      amount: booking.totalAmount,
      scheduledAt: booking.scheduledAt,
      status: booking.status,
      paymentStatus: 'PAID',
    });
  } catch (error) {
    if (error instanceof Error && ['BOOKING_STATE_CHANGED', 'PAYMENT_STATE_CHANGED'].includes(error.message)) {
      return res.status(409).json({ message: 'This booking or payment has already changed. Refresh your bookings.' });
    }
    console.error('[Payments] Verification failed:', error);
    res.status(500).json({ message: 'Could not verify the Razorpay payment.' });
  }
});

router.post('/fail', authMiddleware, requireRole('CUSTOMER'), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = failSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Booking and order IDs are required.' });
    const { bookingId, orderId } = parsed.data;
    const payment = await prisma.payment.findFirst({
      where: { bookingId, transactionId: orderId, status: 'PENDING', booking: { customerId: req.user!.id } },
    });
    if (!payment) return res.status(404).json({ message: 'Pending payment order not found.' });
    const cancelled = await prisma.$transaction(async transaction => {
      const bookingUpdate = await transaction.booking.updateMany({
        where: { id: bookingId, customerId: req.user!.id, status: 'AWAITING_PAYMENT' },
        data: { status: 'CANCELLED' },
      });
      if (bookingUpdate.count !== 1) return false;
      const paymentUpdate = await transaction.payment.updateMany({
        where: { bookingId, transactionId: orderId, status: 'PENDING' },
        data: { status: 'FAILED' },
      });
      if (paymentUpdate.count !== 1) throw new Error('PAYMENT_STATE_CHANGED');
      return true;
    });
    if (!cancelled) return res.status(409).json({ message: 'Booking status has changed and can no longer be cancelled as unpaid.' });
    const cancelledBooking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { id: true, status: true, customerId: true, technicianId: true } });
    if (cancelledBooking) notifyBookingChange(cancelledBooking, 'Your payment was not completed and the booking was cancelled.', { notifyTechnician: false });
    res.json({ message: 'Unpaid booking was cancelled.' });
  } catch (error) {
    if (error instanceof Error && error.message === 'PAYMENT_STATE_CHANGED') {
      return res.status(409).json({ message: 'Payment status changed and can no longer be cancelled as unpaid.' });
    }
    res.status(500).json({ message: 'Could not cancel the unpaid booking.' });
  }
});

export default router;
