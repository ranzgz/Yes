export interface User {
  id: number;
  username: string;
  email: string;
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

export type ActiveTab = 'dashboard' | 'inject' | 'history' | 'users' | 'settings' | 'profile';
