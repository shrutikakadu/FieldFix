import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../authConfig';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !/^Bearer\s+\S+$/i.test(authHeader)) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(/\s+/)[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (
      typeof decoded === 'string' ||
      typeof decoded.id !== 'string' ||
      typeof decoded.email !== 'string' ||
      !['CUSTOMER', 'TECHNICIAN', 'ADMIN'].includes(String(decoded.role))
    ) {
      return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
    }
    req.user = { id: decoded.id, email: decoded.email, role: String(decoded.role) };
    next();
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('JWT_SECRET must be configured')) {
      return res.status(500).json({ message: 'Authentication is not configured on this server.' });
    }
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
};

// Role-based access control middleware
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};
