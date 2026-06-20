import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dbInstance, User } from '../db/db.ts';

export interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'passwordHash'>;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_jwt_secret_gold_purple';

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let token = '';

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Check query params as a fallback if needed, or cookies (if parsed)
    if (!token && req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string; role: string };

    // Fetch user from DB to confirm they still exist and are not blocked
    const user = dbInstance.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Your account has been blocked by the Owner. Access denied.' });
    }

    // Attach user (without password hash) to request
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (error: any) {
    console.error('JWT Verification Error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid or tampered token.' });
  }
};
