import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbInstance } from '../db/db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';
import { isOwner } from '../middleware/role.ts';

const router = Router();

// GET /api/users (list semua user - owner)
router.get('/', requireAuth, isOwner, (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = dbInstance.getUsers().map(({ passwordHash, ...safeUser }) => safeUser);
    
    // Also include audit logs list for owners on this view if helpful, or we can send it
    const auditLogs = dbInstance.getAuditLogs();

    return res.json({ users, auditLogs });
  } catch (error: any) {
    console.error('Fetch Users Error:', error);
    return res.status(500).json({ error: 'Failed to access users collection.' });
  }
});

// POST /api/users (tambah user - owner)
router.post('/', requireAuth, isOwner, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username, email, password, fullname, role, status } = req.body;

    if (!username || !email || !password || !fullname || !role) {
      return res.status(400).json({ error: 'Missing required credentials (username, email, password, fullname, role).' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    }

    // Check duplicate
    if (dbInstance.getUserByUsername(username)) {
      return res.status(400).json({ error: 'Username already in use.' });
    }

    if (dbInstance.getUserByEmail(email)) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = dbInstance.addUser({
      username,
      email,
      fullname,
      passwordHash,
      role: role === 'owner' ? 'owner' : 'member',
      status: status === 'blocked' ? 'blocked' : 'active',
    });

    // Logging audit
    dbInstance.addAuditLog(
      req.user!.id,
      req.user!.username,
      'ADMIN_CREATE_USER',
      `Owner registered new account: [${role.toUpperCase()}] ${username} (${email}). ID: ${newUser.id}`
    );

    const { passwordHash: _, ...safeUser } = newUser;
    return res.json({
      message: 'User created successfully.',
      user: safeUser,
    });
  } catch (error: any) {
    console.error('Create User Error:', error);
    return res.status(500).json({ error: 'Internal system fault adding user.' });
  }
});

// PUT /api/users/:id (edit user - owner)
router.put('/:id', requireAuth, isOwner, (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetId = parseInt(req.params.id);
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    const { username, email, password, fullname, role, status } = req.body;

    const userToEdit = dbInstance.getUserById(targetId);
    if (!userToEdit) {
      return res.status(404).json({ error: 'Target user not found.' });
    }

    // Double check that we are not demoting the last active owner (safety rule!)
    if (userToEdit.role === 'owner' && role === 'member') {
      const ownersCount = dbInstance.getUsers().filter(u => u.role === 'owner' && u.status === 'active').length;
      if (ownersCount <= 1) {
        return res.status(400).json({ error: 'Access denied: You cannot demote the last remaining active system Owner.' });
      }
    }

    // Double check that we are not blocking ourselves
    if (userToEdit.id === req.user!.id && status === 'blocked') {
      return res.status(400).json({ error: 'Access denied: Self-blocking is disabled.' });
    }

    // Verify unique username/email changes
    if (username && username.toLowerCase() !== userToEdit.username.toLowerCase()) {
      if (dbInstance.getUserByUsername(username)) {
        return res.status(400).json({ error: 'Username contains collision.' });
      }
      userToEdit.username = username; // Update username manually if changed
    }

    const updates: any = {};
    if (email) {
      if (email.toLowerCase() !== userToEdit.email.toLowerCase()) {
        if (dbInstance.getUserByEmail(email)) {
          return res.status(400).json({ error: 'Email contains collision.' });
        }
      }
      updates.email = email;
    }

    if (fullname) updates.fullname = fullname;
    if (role) updates.role = role;
    if (status) updates.status = status;

    if (password && password.trim() !== '') {
      if (password.length < 5) {
        return res.status(400).json({ error: 'New password must be at least 5 characters long.' });
      }
      const salt = bcrypt.genSaltSync(10);
      updates.passwordHash = bcrypt.hashSync(password, salt);
    }

    const updated = dbInstance.updateUser(targetId, updates);

    // Logging audit
    dbInstance.addAuditLog(
      req.user!.id,
      req.user!.username,
      'ADMIN_EDIT_USER',
      `Owner updated user ${userToEdit.username} details. Role -> ${updated?.role}, Status -> ${updated?.status}`
    );

    const { passwordHash: _, ...safeUser } = updated!;
    return res.json({
      message: 'User details updated successfully.',
      user: safeUser,
    });
  } catch (error: any) {
    console.error('Update User Error:', error);
    return res.status(500).json({ error: 'Internal system fault updating user.' });
  }
});

// DELETE /api/users/:id (hapus user - owner)
router.delete('/:id', requireAuth, isOwner, (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetId = parseInt(req.params.id);
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    const userToDelete = dbInstance.getUserById(targetId);
    if (!userToDelete) {
      return res.status(404).json({ error: 'User does not exist.' });
    }

    // Prevent deleting ourselves
    if (userToDelete.id === req.user!.id) {
      return res.status(400).json({ error: 'Access denied: Self-deletion is disabled.' });
    }

    // Prevent deleting the last owner
    if (userToDelete.role === 'owner') {
      const owners = dbInstance.getUsers().filter(u => u.role === 'owner');
      if (owners.length <= 1) {
        return res.status(400).json({ error: 'Access denied: Cannot delete the absolute last system Owner.' });
      }
    }

    dbInstance.deleteUser(targetId);

    // Logging audit
    dbInstance.addAuditLog(
      req.user!.id,
      req.user!.username,
      'ADMIN_DELETE_USER',
      `Owner hard deleted user account: ${userToDelete.username} (${userToDelete.email})`
    );

    return res.json({
      message: `User '${userToDelete.username}' successfully expunged from database.`,
    });
  } catch (error: any) {
    console.error('Delete User Error:', error);
    return res.status(500).json({ error: 'Internal system fault deleting user.' });
  }
});

export default router;
