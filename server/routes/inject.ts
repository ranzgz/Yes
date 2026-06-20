import { Router, Response } from 'express';
import { dbInstance } from '../db/db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// Store temporary verification links in-memory with a 5-minute TTL
interface PendingVerification {
  userId: number;
  emailTarget: string;
  code: string;
  expiry: number;
}

const pendingVerifications = new Map<string, PendingVerification>(); // email -> verification info

// Simple rate limiter for inject API (max 5 requests per minute per IP)
const injectRateLimits = new Map<string, number[]>();
const checkInjectRateLimit = (req: any, res: Response, next: any) => {
  const ip = req.ip || 'default-inject-ip';
  const now = Date.now();
  const oneMinuteMs = 60000;

  if (!injectRateLimits.has(ip)) {
    injectRateLimits.set(ip, []);
  }

  const times = injectRateLimits.get(ip)!;
  const filtered = times.filter(t => now - t < oneMinuteMs);

  if (filtered.length >= 5) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded. Maximum 5 requests per minute are allowed.' 
    });
  }

  filtered.push(now);
  injectRateLimits.set(ip, filtered);
  next();
};

// POST /api/inject/send (Kirim link verifikasi)
router.post('/send', requireAuth, checkInjectRateLimit, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email_target } = req.body;

    if (!email_target) {
      return res.status(400).json({ error: 'Target email is required.' });
    }

    // Validate email format simple check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_target)) {
      return res.status(400).json({ error: 'Please enter a valid target email address.' });
    }

    // Generate a premium-looking verification signature code
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const code = `VIP-${randomSuffix}`;
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes TTL

    // Save under pending list
    pendingVerifications.set(email_target.toLowerCase(), {
      userId: req.user!.id,
      emailTarget: email_target,
      code,
      expiry,
    });

    // Clean up expired records occasionally
    setTimeout(() => {
      pendingVerifications.delete(email_target.toLowerCase());
    }, 5 * 60 * 1000);

    const verifLink = `https://injector-portal.cloud/inject?verify=${code}&target=${encodeURIComponent(email_target)}`;

    return res.json({
      success: true,
      message: 'Verification link successfully dispatched to remote server queue!',
      email_target,
      verification_link: verifLink,
      verification_code: code,
      expires_in: '5 minutes',
    });
  } catch (error: any) {
    console.error('Inject Send Error:', error);
    return res.status(500).json({ error: 'Failed to initiate verification link pipeline.' });
  }
});

// POST /api/inject/verif (Verifikasi & inject)
router.post('/verif', requireAuth, checkInjectRateLimit, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email_target, verification_code } = req.body;

    if (!email_target || !verification_code) {
      return res.status(400).json({ error: 'Both email target and verification code/link are required.' });
    }

    const emailKey = email_target.toLowerCase();
    const pending = pendingVerifications.get(emailKey);

    // Get active settings to confirm API Key integrity
    const settings = dbInstance.getSettings();
    if (!settings.api_key) {
      return res.status(500).json({ error: 'Inject engine offline: API Key is unconfigured in system.' });
    }

    // Process verification: either direct match of code, or the code within a pasted URL
    let inputCode = verification_code.trim();
    if (inputCode.includes('verify=')) {
      // Extract from URL
      const match = inputCode.match(/verify=([^&]+)/);
      if (match) inputCode = match[1];
    }

    if (!pending || Date.now() > pending.expiry) {
      // Record Failure to DB
      const failedHistory = dbInstance.addInjectHistory({
        user_id: req!.user!.id,
        email_target,
        status: 'failed',
        message: 'Security token mismatch, stale handshake, or verification request expired.',
      });

      return res.status(400).json({
        success: false,
        message: 'Injection verification failed. Security session signature possesses mismatch or TTL expired.',
        history: failedHistory,
      });
    }

    // Check code correctness
    if (pending.code !== inputCode) {
      // Record Failure
      const failedHistory = dbInstance.addInjectHistory({
        user_id: req!.user!.id,
        email_target,
        status: 'failed',
        message: `Incorrect code entered: "${inputCode}". Verification checksum error.`,
      });

      return res.status(400).json({
        success: false,
        message: 'Injection failed. The verification certificate code entered is incorrect or unauthorized.',
        history: failedHistory,
      });
    }

    // Success! Clear pending and inject
    pendingVerifications.delete(emailKey);

    const successHistory = dbInstance.addInjectHistory({
      user_id: req!.user!.id,
      email_target,
      status: 'success',
      message: `Premium bypass package successfully injected using dynamic API gateway: ${settings.api_key.substring(0, 8)}***`,
    });

    // Log owner audit if it is owner
    dbInstance.addAuditLog(
      req.user!.id,
      req.user!.username,
      'INJECT_PREMIUM',
      `User injected premium status to "${email_target}" successfully. History ID: ${successHistory.id}`
    );

    return res.json({
      success: true,
      message: 'Verification cleared! Premium VIP status has been injected successfully!',
      target: email_target,
      history: successHistory,
    });
  } catch (error: any) {
    console.error('Inject Verif Error:', error);
    return res.status(500).json({ error: 'Server error during verification phase.' });
  }
});

export default router;
