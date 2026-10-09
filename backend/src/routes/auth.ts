import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { createAuthToken, getJwtSecret } from '../authConfig';

const router = Router();
const prisma = new PrismaClient();
const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(100, 'Name must be 100 characters or fewer.'),
  email: z.string().trim().email('Enter a valid email address.').max(254).transform(value => value.toLowerCase()),
  phone: z.string().trim().max(32).optional().default(''),
  password: z.string().min(6, 'Password must be at least 6 characters.').refine(
    value => Buffer.byteLength(value, 'utf8') <= 72,
    'Password must be at most 72 bytes.',
  ),
  role: z.enum(['CUSTOMER', 'TECHNICIAN']).optional().default('CUSTOMER'),
  technicianVerifiedId: z.string().trim().max(100).optional(),
  skills: z.array(z.string().trim().min(1).max(100)).max(20).optional().default([]),
  city: z.string().trim().max(100).optional().default('Bangalore'),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(1).max(1024),
});

// ==================== REGISTER ====================
router.post('/register', async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Invalid registration details.' });
    }
    getJwtSecret();
    const { name, email: normalizedEmail, phone, password, role: userRole, skills, city } = parsed.data;
    const normalizedTechnicianId = String(parsed.data.technicianVerifiedId || '').toUpperCase();

    // Technicians MUST provide a verified ID
    if (userRole === 'TECHNICIAN') {
      if (!normalizedTechnicianId || normalizedTechnicianId.length < 6) {
        return res.status(400).json({ message: 'A valid Government / Trade-Board Verified Technician ID is required to register as a technician.' });
      }
      if (skills.length === 0) {
        return res.status(400).json({ message: 'Select at least one service skill to register as a technician.' });
      }
      // Check if verifiedId is already in use
      const existing = await prisma.technicianProfile.findUnique({ where: { technicianVerifiedId: normalizedTechnicianId } });
      if (existing) {
        return res.status(409).json({ message: 'This Technician Verified ID is already registered. Contact support if this is an error.' });
      }
    }

    // Check duplicate email
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.$transaction(async transaction => {
      const createdUser = await transaction.user.create({
        data: { name: String(name).trim(), email: normalizedEmail, phone: phone || '', passwordHash, role: userRole },
      });
      if (userRole === 'TECHNICIAN') {
        await transaction.technicianProfile.create({
          data: {
            userId: createdUser.id,
            technicianVerifiedId: normalizedTechnicianId,
            skills: JSON.stringify(skills),
            specialization: skills[0] || '',
            city,
            isAvailable: true,
          },
        });
      }
      return createdUser;
    });

    const token = createAuthToken(user);

    const technicianProfile = userRole === 'TECHNICIAN'
      ? await prisma.technicianProfile.findUnique({ where: { userId: user.id } })
      : null;

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, createdAt: user.createdAt, technicianProfile },
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ message: 'An account with those registration details already exists.' });
    }
    if (error instanceof Error && error.message.startsWith('JWT_SECRET must be configured')) {
      return res.status(500).json({ message: 'Authentication is not configured on this server.' });
    }
    console.error('[Auth] Register error:', error instanceof Error ? error.message : error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// ==================== LOGIN ====================
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'A valid email and password are required.' });
    }
    getJwtSecret();
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
      include: { technicianProfile: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = createAuthToken(user);

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        technicianProfile: user.technicianProfile || null,
      },
    });
  } catch (error: any) {
    if (error instanceof Error && error.message.startsWith('JWT_SECRET must be configured')) {
      return res.status(500).json({ message: 'Authentication is not configured on this server.' });
    }
    console.error('[Auth] Login error:', error instanceof Error ? error.message : error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// ==================== GET TECHNICIANS (public - for customer to browse) ====================
router.get('/technicians', async (req: Request, res: Response) => {
  try {
    const { skill, city, name, available } = req.query;

    const profiles = await prisma.technicianProfile.findMany({
      where: {
        ...(available === 'true' ? { isAvailable: true } : {}),
        ...(city ? { city: { contains: String(city), mode: 'insensitive' } } : {}),
        ...(skill ? { skills: { contains: String(skill) } } : {}),
        ...(name ? { user: { name: { contains: String(name), mode: 'insensitive' } } } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
      },
      orderBy: [{ rating: 'desc' }, { totalJobs: 'desc' }],
    });

    res.json({ technicians: profiles });
  } catch (error: any) {
    console.error('[Auth] Technicians fetch error:', error.message);
    res.status(500).json({ message: 'Server error fetching technicians.' });
  }
});

router.patch('/technicians/availability', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { technicianId, isAvailable } = req.body;
    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ message: 'Availability must be true or false.' });
    }
    const targetUserId = req.user?.role === 'ADMIN' ? technicianId : req.user?.id;
    if (!targetUserId || (req.user?.role !== 'ADMIN' && req.user?.role !== 'TECHNICIAN')) {
      return res.status(403).json({ message: 'Only a technician or admin can update availability.' });
    }
    const profile = await prisma.technicianProfile.update({
      where: { userId: targetUserId },
      data: { isAvailable },
      select: { userId: true, isAvailable: true },
    });
    res.json(profile);
  } catch (error) {
    res.status(404).json({ message: 'Technician profile not found.' });
  }
});

// ==================== GET CURRENT USER (ME) ====================
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true, technicianProfile: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ user });
  } catch (error: any) {
    console.error('[Auth] Current user lookup failed:', error instanceof Error ? error.message : error);
    return res.status(500).json({ message: 'Could not load the current user.' });
  }
});

export default router;
