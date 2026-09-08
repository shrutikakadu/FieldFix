import { Router, Request, Response } from 'express';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'FieldFix REST API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Demo Stats endpoint for Admin Dashboard
router.get('/stats', (req: Request, res: Response) => {
  res.status(200).json({
    activeJobs: 24,
    availableTechs: 12,
    pendingRequests: 5,
    todayCompleted: 48
  });
});

// Demo Bookings list endpoint
router.get('/bookings', (req: Request, res: Response) => {
  res.status(200).json([
    {
      id: 'bk_101',
      customerName: 'Alex Johnson',
      service: 'AC Repair & Maintenance',
      status: 'IN_PROGRESS',
      technicianName: 'David Miller',
      location: { lat: 37.7749, lng: -122.4194 },
      createdAt: new Date().toISOString()
    },
    {
      id: 'bk_102',
      customerName: 'Sarah Williams',
      service: 'Electrical Wiring Inspection',
      status: 'DISPATCHED',
      technicianName: 'Elena Rostova',
      location: { lat: 37.7833, lng: -122.4167 },
      createdAt: new Date().toISOString()
    }
  ]);
});

export default router;
