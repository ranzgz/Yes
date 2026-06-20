import { Router, Response } from 'express';
import { dbInstance } from '../db/db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';
import { isOwner, isMemberOrOwner } from '../middleware/role.ts';

const router = Router();

// GET /api/history (owner only - history semua user)
router.get('/', requireAuth, isOwner, (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = dbInstance.getInjectHistory();
    // Return all history
    return res.json({ history });
  } catch (error: any) {
    console.error('Fetch All History Error:', error);
    return res.status(500).json({ error: 'Failed to fetch inject history records.' });
  }
});

// GET /api/history/me (member/owner - history sendiri)
router.get('/me', requireAuth, isMemberOrOwner, (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = dbInstance.getInjectHistoryByUserId(req.user!.id);
    return res.json({ history });
  } catch (error: any) {
    console.error('Fetch Self History Error:', error);
    return res.status(500).json({ error: 'Failed to fetch personal inject history.' });
  }
});

export default router;
