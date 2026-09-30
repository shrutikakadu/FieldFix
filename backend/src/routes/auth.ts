import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fieldfix-jwt-secret-2026-shrutika';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ==================== REGISTER ====================
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role, technicianVerifiedId, skills, city } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const validRoles = ['CUSTOMER', 'TECHNICIAN', 'ADMIN'];
    const userRole = role || 'CUSTOMER';
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({ message: 'Invalid role. Must be CUSTOMER, TECHNICIAN, or ADMIN.' });
    }

    // Technicians MUST provide a verified ID
    if (userRole === 'TECHNICIAN') {
      if (!technicianVerifiedId || technicianVerifiedId.trim().length < 6) {
        return res.status(400).json({ message: 'A valid Government / Trade-Board Verified Technician ID is required to register as a technician.' });
      }
      // Check if verifiedId is already in use
      const existing = await prisma.technicianProfile.findUnique({ where: { technicianVerifiedId } });
      if (existing) {
        return res.status(409).json({ message: 'This Technician Verified ID is already registered. Contact support if this is an error.' });
      }
    }

    // Check duplicate email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: { name, email, phone: phone || '', passwordHash, role: userRole },
    });

    // If TECHNICIAN, also create their profile
    if (userRole === 'TECHNICIAN') {
      await prisma.technicianProfile.create({
        data: {
          userId: user.id,
          technicianVerifiedId: technicianVerifiedId.trim().toUpperCase(),
          skills: skills ? JSON.stringify(Array.isArray(skills) ? skills : [skills]) : '[]',
          specialization: Array.isArray(skills) && skills.length > 0 ? skills[0] : (skills || ''),
          city: city || 'Bangalore',
          isAvailable: true,
        },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
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
      where: { email },
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
    const { skill, city, available } = req.query;

    const profiles = await prisma.technicianProfile.findMany({
      where: {
        ...(available === 'true' ? { isAvailable: true } : {}),
        ...(city ? { city: { contains: String(city), mode: 'insensitive' } } : {}),
        ...(skill ? { skills: { contains: String(skill) } } : {}),
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
