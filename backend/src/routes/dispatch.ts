import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/authMiddleware';
import { findDispatchCandidate } from '../services/dispatchService';

const router = Router();
const prisma = new PrismaClient();

const matchSchema = z.object({
  service: z.string().trim().min(1).max(100),
  city: z.string().trim().min(1).max(100),
}).strict();

router.post('/match', authMiddleware, requireRole('CUSTOMER'), async (req: AuthRequest, res: Response) => {
  const parsed = matchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Service and city are required.' });
  }

  try {
    const technician = await findDispatchCandidate(prisma, parsed.data.service, parsed.data.city);
    if (!technician) {
      return res.status(404).json({ message: 'No available technician offers this service in that city.' });
    }
    return res.json({ technician });
  } catch (error) {
    console.error('[Dispatch] Match failed:', error);
    return res.status(500).json({ message: 'Could not find an available technician.' });
  }
});

export default router;
