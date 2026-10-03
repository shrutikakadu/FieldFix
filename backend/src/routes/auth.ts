import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fieldfix-jwt-secret-2026-shrutika';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

// ==================== REGISTER ====================
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role, technicianVerifiedId, skills, city } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedTechnicianId = String(technicianVerifiedId || '').trim().toUpperCase();

    const validRoles = ['CUSTOMER', 'TECHNICIAN'];
    const userRole = role || 'CUSTOMER';
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({ message: 'Invalid role. Must be CUSTOMER, TECHNICIAN, or ADMIN.' });
    }

    // Technicians MUST provide a verified ID
    if (userRole === 'TECHNICIAN') {
      if (!normalizedTechnicianId || normalizedTechnicianId.length < 6) {
        return res.status(400).json({ message: 'A valid Government / Trade-Board Verified Technician ID is required to register as a technician.' });
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
            skills: skills ? JSON.stringify(Array.isArray(skills) ? skills : [skills]) : '[]',
            specialization: Array.isArray(skills) && skills.length > 0 ? skills[0] : (skills || ''),
            city: city || 'Bangalore',
            isAvailable: true,
          },
        });
      }
      return createdUser;
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const technicianProfile = userRole === 'TECHNICIAN'
      ? await prisma.technicianProfile.findUnique({ where: { userId: user.id } })
      : null;

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, createdAt: user.createdAt, technicianProfile },
    });
  } catch (error: any) {
    console.error('[Auth] Register error:', error.message);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// ==================== LOGIN ====================
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

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

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

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
    console.error('[Auth] Login error:', error.message);
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
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ user });
  } catch (error: any) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
});

export default router;
