import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.ts';

export const isOwner = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. Authentication is required.' });
  }

  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden. Access restricted to Owners only.' });
  }

  next();
};

export const isMemberOrOwner = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. Authentication is required.' });
  }

  if (req.user.role !== 'member' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden. Access level insufficient.' });
  }

  next();
};
