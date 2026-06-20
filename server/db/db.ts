import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  fullname: string;
  role: 'member' | 'owner';
  status: 'active' | 'blocked';
  created_at: string;
}

export interface InjectHistory {
  id: number;
  user_id: number;
  username?: string;
  email_target: string;
  status: 'success' | 'failed';
  message: string;
  created_at: string;
}

export interface Setting {
  id: number;
  api_key: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  user_id: number;
  username: string;
  action: string;
  details: string;
}

interface DatabaseSchema {
  users: User[];
  inject_history: InjectHistory[];
  settings: Setting;
  audit_logs: AuditLog[];
}

const DB_PATH = path.resolve('db.json');

// Default database state
const createDefaultDb = (): DatabaseSchema => {
  const salt = bcrypt.genSaltSync(10);
  return {
    users: [
      {
        id: 1,
        username: 'owner',
        email: 'owner@premium-inject.com',
        fullname: 'System Owner Premium',
        passwordHash: bcrypt.hashSync('owner123', salt),
        role: 'owner',
        status: 'active',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        username: 'member',
        email: 'member@test.com',
        fullname: 'Demo Member',
        passwordHash: bcrypt.hashSync('member123', salt),
        role: 'member',
        status: 'active',
        created_at: new Date().toISOString(),
      },
    ],
    inject_history: [
      {
        id: 1,
        user_id: 2,
        username: 'member',
        email_target: 'victim1@example.com',
        status: 'success',
        message: 'Premium feature successfully injected to local storage profile',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 2,
        user_id: 2,
        username: 'member',
        email_target: 'client@gmail.com',
        status: 'failed',
        message: 'Verification failed: verification code mismatch or expired link',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      }
    ],
    settings: {
      id: 1,
      api_key: 'INJECT_KEY_FBBF24_7C3AED_X99201',
      updated_at: new Date().toISOString(),
    },
    audit_logs: [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        user_id: 1,
        username: 'owner',
        action: 'INITIALIZE',
        details: 'Premium Inject system db successfully initialized with standard configuration',
      },
    ],
  };
};

export class LocalDb {
  private static instance: LocalDb;
  private memoryDb!: DatabaseSchema;

  private constructor() {
    this.load();
  }

  public static getInstance(): LocalDb {
    if (!LocalDb.instance) {
      LocalDb.instance = new LocalDb();
    }
    return LocalDb.instance;
  }

  private load() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        this.memoryDb = JSON.parse(data);
        // Verify schema properties
        if (!this.memoryDb.users || !this.memoryDb.inject_history || !this.memoryDb.settings) {
          throw new Error('Invalid schema');
        }
      } else {
        this.resetToDefault();
      }
    } catch (e) {
      console.warn('DB file not found or corrupted, loading seeded defaults...');
      this.resetToDefault();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.memoryDb, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing database to disk:', e);
    }
  }

  public resetToDefault() {
    this.memoryDb = createDefaultDb();
    this.save();
  }

  // --- USERS TABLE HELPER METHODS ---
  public getUsers(): User[] {
    return this.memoryDb.users;
  }

  public getUserById(id: number): User | undefined {
    return this.memoryDb.users.find(u => u.id === id);
  }

  public getUserByUsername(username: string): User | undefined {
    return this.memoryDb.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public getUserByEmail(email: string): User | undefined {
    return this.memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: Omit<User, 'id' | 'created_at'>): User {
    const nextId = this.memoryDb.users.reduce((max, u) => u.id > max ? u.id : max, 0) + 1;
    const newUser: User = {
      ...user,
      id: nextId,
      created_at: new Date().toISOString(),
    };
    this.memoryDb.users.push(newUser);
    this.save();
    return newUser;
  }

  public updateUser(id: number, data: Partial<Omit<User, 'id' | 'created_at' | 'username'>>): User | undefined {
    const userIndex = this.memoryDb.users.findIndex(u => u.id === id);
    if (userIndex === -1) return undefined;

    const updatedUser = {
      ...this.memoryDb.users[userIndex],
      ...data,
    };
    this.memoryDb.users[userIndex] = updatedUser;
    this.save();
    return updatedUser;
  }

  public deleteUser(id: number): boolean {
    const userIndex = this.memoryDb.users.findIndex(u => u.id === id);
    if (userIndex === -1) return false;

    // Hard delete for local prototype
    this.memoryDb.users.splice(userIndex, 1);
    this.save();
    return true;
  }

  // --- INJECT HISTORY TABLE HELPER METHODS ---
  public getInjectHistory(): InjectHistory[] {
    return this.memoryDb.inject_history;
  }

  public getInjectHistoryByUserId(userId: number): InjectHistory[] {
    return this.memoryDb.inject_history.filter(h => h.user_id === userId);
  }

  public addInjectHistory(history: Omit<InjectHistory, 'id' | 'created_at'>): InjectHistory {
    const nextId = this.memoryDb.inject_history.reduce((max, h) => h.id > max ? h.id : max, 0) + 1;
    const user = this.getUserById(history.user_id);
    const newHistory: InjectHistory = {
      ...history,
      id: nextId,
      username: user ? user.username : 'unknown',
      created_at: new Date().toISOString(),
    };
    this.memoryDb.inject_history.unshift(newHistory); // Newest first
    this.save();
    return newHistory;
  }

  // --- SETTINGS TABLE HELPER METHODS ---
  public getSettings(): Setting {
    return this.memoryDb.settings;
  }

  public updateApiKey(key: string): Setting {
    this.memoryDb.settings.api_key = key;
    this.memoryDb.settings.updated_at = new Date().toISOString();
    this.save();
    return this.memoryDb.settings;
  }

  // --- AUDIT TRAIL LOGGING HELPER METHODS ---
  public getAuditLogs(): AuditLog[] {
    return this.memoryDb.audit_logs;
  }

  public addAuditLog(user_id: number, username: string, action: string, details: string): AuditLog {
    const nextId = this.memoryDb.audit_logs.reduce((max, l) => l.id > max ? l.id : max, 0) + 1;
    const newLog: AuditLog = {
      id: nextId,
      timestamp: new Date().toISOString(),
      user_id,
      username,
      action,
      details,
    };
    this.memoryDb.audit_logs.unshift(newLog); // Newest first
    this.save();
    return newLog;
  }
}

export const dbInstance = LocalDb.getInstance();
