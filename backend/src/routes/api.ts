import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const activeJobs = await prisma.booking.count({ where: { status: { in: ['IN_PROGRESS', 'DISPATCHED', 'ACCEPTED'] } } });
    const availableTechs = await prisma.technicianProfile.count({ where: { isAvailable: true } });
    const pendingRequests = await prisma.booking.count({ where: { status: 'PENDING' } });
    
    // For today completed, theoretically we'd check dates, but let's just count COMPLETED
    const todayCompleted = await prisma.booking.count({ where: { status: 'COMPLETED' } });

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
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        customer: true,
        technician: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = bookings.map(b => ({
      id: b.id,
      customerName: b.customer.name,
      service: b.category.name,
      status: b.status,
      technicianName: b.technician?.name || 'Unassigned',
      address: b.address,
      location: { lat: b.latitude, lng: b.longitude },
      createdAt: b.createdAt
    }));
    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

export default router;
