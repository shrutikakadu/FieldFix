import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Razorpay from 'razorpay';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();
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
    const { technicianId, service, address, scheduledAt, description } = req.body;
    const serviceName = String(service || '').trim();
    const serviceAddress = String(address || '').trim();
    const amount = servicePrices[serviceName];
    const appointment = new Date(scheduledAt);
    if (!technicianId || !amount || !serviceAddress || Number.isNaN(appointment.getTime()) || appointment <= new Date()) {
      return res.status(400).json({ message: 'Choose a valid service, address, technician, and future appointment time.' });
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
          latitude: technician.technicianProfile!.currentLat ?? 12.9716,
          longitude: technician.technicianProfile!.currentLng ?? 77.5946,
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
    });
  } catch (error) {
    console.error('[Payments] Order creation failed:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Could not start payment.' });
  }
});

router.post('/verify', authMiddleware, requireRole('CUSTOMER'), async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, orderId, paymentId, signature } = req.body;
    if (!bookingId || !orderId || !paymentId || !signature) {
      return res.status(400).json({ message: 'Razorpay payment details are incomplete.' });
    }
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
      await transaction.payment.update({
        where: { bookingId },
        data: { transactionId: paymentId, status: 'PAID' },
      });
      return transaction.booking.update({
        where: { id: bookingId },
        data: { status: 'PENDING' },
        include: { customer: true, technician: true, category: true },
      });
    });

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
    console.error('[Payments] Verification failed:', error);
    res.status(500).json({ message: 'Could not verify the Razorpay payment.' });
  }
});

router.post('/fail', authMiddleware, requireRole('CUSTOMER'), async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, orderId } = req.body;
    const payment = await prisma.payment.findFirst({
      where: { bookingId, transactionId: orderId, status: 'PENDING', booking: { customerId: req.user!.id } },
    });
    if (!payment) return res.status(404).json({ message: 'Pending payment order not found.' });
    await prisma.$transaction([
      prisma.payment.update({ where: { bookingId }, data: { status: 'FAILED' } }),
      prisma.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } }),
    ]);
    res.json({ message: 'Unpaid booking was cancelled.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not cancel the unpaid booking.' });
  }
});

export default router;
