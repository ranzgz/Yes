import { Router, Response } from 'express';
import { dbInstance } from '../db/db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';
import { isOwner } from '../middleware/role.ts';

const router = Router();

// GET /api/settings (owner only - fetch current API key)
router.get('/', requireAuth, isOwner, (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = dbInstance.getSettings();
    return res.json({ settings });
  } catch (error: any) {
    console.error('Fetch Settings Error:', error);
    return res.status(500).json({ error: 'Failed to access configuration store.' });
  }
});

// PUT /api/settings/api-key (owner only - update API key)
router.put('/api-key', requireAuth, isOwner, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { api_key } = req.body;

    if (!api_key || api_key.trim() === '') {
      return res.status(400).json({ error: 'API Key value cannot be empty.' });
    }

    const updated = dbInstance.updateApiKey(api_key);

    // Audit logs entry
    dbInstance.addAuditLog(
      req.user!.id,
      req.user!.username,
      'ADMIN_UPDATE_API_KEY',
      `Owner updated system Premium Inject API Key.`
    );

    return res.json({
      success: true,
      message: 'System API Key successfully updated and synced across routes.',
      settings: updated,
    });
  } catch (error: any) {
    console.error('Update API Key Error:', error);
    return res.status(500).json({ error: 'Failed to update system API Key.' });
  }
});

export default router;
