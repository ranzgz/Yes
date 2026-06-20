import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbInstance } from '../db/db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_jwt_secret_gold_purple';

// Simple slide-window rate limiter for Auth (max 5 requests per minute per IP)
const rateLimits = new Map<string, number[]>();

export const authRateLimiter = (req: Request, res: Response, next: any) => {
  const ip = req.ip || req.headers['x-forwarded-for'] as string || 'default-ip';
  const now = Date.now();
  const oneMinuteMs = 60000;

  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, []);
  }

  const timestamps = rateLimits.get(ip)!;
  // Clean timestamps older than 1 minute
  const activeTimestamps = timestamps.filter(t => now - t < oneMinuteMs);
  
  if (activeTimestamps.length >= 5) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded. Maximum 5 requests per minute are allowed.' 
    });
  }

  activeTimestamps.push(now);
  rateLimits.set(ip, activeTimestamps);
  next();
};

// POST /api/auth/register
router.post('/register', authRateLimiter, (req: Request, res: Response) => {
  try {
    const { username, email, password, fullname } = req.body;

    if (!username || !email || !password || !fullname) {
      return res.status(400).json({ error: 'All fields are required (username, email, password, fullname).' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    }

    if (password.length < 5) {
      return res.status(400).json({ error: 'Password must be at least 5 characters long.' });
    }

    // Check if user already exists
    const existingUser = dbInstance.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    const existingEmail = dbInstance.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Add user as member by default
    const newUser = dbInstance.addUser({
      username,
      email,
      fullname,
      passwordHash,
      role: 'member',
      status: 'active',
    });

    // Create session token
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Audit log
    dbInstance.addAuditLog(
      newUser.id,
      newUser.username,
      'USER_REGISTER',
      `User ${newUser.username} registered their account successfully.`
    );

    return res.json({
      message: 'Account registered successfully!',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullname: newUser.fullname,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error: any) {
    console.error('Register API Error:', error);
    return res.status(500).json({ error: 'Registration failed. Please try again later.' });
  }
});

// POST /api/auth/login
router.post('/login', authRateLimiter, (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = dbInstance.getUserByUsername(username);
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    // Check blocked status
    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Your account has been blocked by the Owner.' });
    }

    // Verify password
    const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Audit log
    dbInstance.addAuditLog(
      user.id,
      user.username,
      'USER_LOGIN',
      `User ${user.username} logged in successfully.`
    );

    return res.json({
      message: 'Logged in successfully!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error('Login API Error:', error);
    return res.status(500).json({ error: 'Login failed. Please try again later.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

export default router;
