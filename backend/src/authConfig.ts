import jwt from 'jsonwebtoken';

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 bytes.');
  }
  return secret;
};

export const getJwtExpiresIn = (): jwt.SignOptions['expiresIn'] =>
  (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

export const createAuthToken = (user: { id: string; email: string; role: string }): string =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: getJwtExpiresIn() },
  );
