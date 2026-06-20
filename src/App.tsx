import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Zap, 
  ShieldAlert, 
  User as UserIcon,
  Sparkles,
  Lock,
  Mail,
  Loader2,
  LockKeyhole,
  CheckCircle,
  Eye,
  EyeOff,
  UserCheck2,
  Calendar,
  Layers,
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types import
import { User, InjectHistory, Setting, AuditLog, ActiveTab } from './types.ts';

// Components import
import Sidebar from './components/Sidebar.tsx';
import DashboardView from './components/DashboardView.tsx';
import InjectView from './components/InjectView.tsx';
import HistoryView from './components/HistoryView.tsx';
import ManageUsersView from './components/ManageUsersView.tsx';
import SettingsView from './components/SettingsView.tsx';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Nav state
  const [activeTab, setActiveTab] = useState<ActiveTab>('inject');

  // Global administrative state lists (synced for owners)
  const [users, setUsers] = useState<User[]>([]);
  const [history, setHistory] = useState<InjectHistory[]>([]);
  const [settings, setSettings] = useState<Setting | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Page level error/loading
  const [loadingData, setLoadingData] = useState(false);

  // Auth Forms login/register state
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [fullnameInput, setFullnameInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Initialize the auth session
  useEffect(() => {
    const bootstrapAuth = async () => {
      if (!token) {
        setIsInitializing(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Session expired.');
        }

        setCurrentUser(data.user);
        // Default tab based on role
        if (data.user.role === 'owner') {
          setActiveTab('dashboard');
        } else {
          setActiveTab('inject');
        }
      } catch (err) {
        console.warn('Session bootstrap failure:', err);
        handleLogout();
      } finally {
        setIsInitializing(false);
      }
    };

    bootstrapAuth();
  }, [token]);

  // Synchronize database information on authentication or activeTab swaps
  const syncDatabaseInfo = async () => {
    if (!token || !currentUser) return;

    setLoadingData(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      if (currentUser.role === 'owner') {
        // Fetch Admin users and audit logs
        const usersRes = await fetch('/api/users', { headers });
        const usersData = await usersRes.json();
        if (usersRes.ok) {
          setUsers(usersData.users || []);
          setAuditLogs(usersData.auditLogs || []);
        }

        // Fetch all history logs
        const historyRes = await fetch('/api/history', { headers });
        const historyData = await historyRes.json();
        if (historyRes.ok) {
          setHistory(historyData.history || []);
        }

        // Fetch settings config
        const settingsRes = await fetch('/api/settings', { headers });
        const settingsData = await settingsRes.json();
        if (settingsRes.ok) {
          setSettings(settingsData.settings || null);
        }
      } else {
        // Standard member fetches only their self history
        const historyMeRes = await fetch('/api/history/me', { headers });
        const historyMeData = await historyMeRes.json();
        if (historyMeRes.ok) {
          setHistory(historyMeData.history || []);
        }
      }
    } catch (e) {
      console.error('Data sync failed:', e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      syncDatabaseInfo();
    }
  }, [currentUser, activeTab]);

  // Authenticators
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      setAuthError('Populate both username and password.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication rejected.');
      }

      setAuthSuccess('Authorized! Launching tunnel...');
      localStorage.setItem('token', data.token);
      
      // Delay to let animation resolve nicely
      setTimeout(() => {
        setToken(data.token);
        setCurrentUser(data.user);
        setUsernameInput('');
        setPasswordInput('');
        setAuthSuccess('');
      }, 800);

    } catch (err: any) {
      setAuthError(err.message || 'Login handshake failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !emailInput || !passwordInput || !fullnameInput) {
      setAuthError('Please fill in check parameters.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput,
          email: emailInput,
          password: passwordInput,
          fullname: fullnameInput
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration rejected.');
      }

      setAuthSuccess('Account created! Logging in...');
      localStorage.setItem('token', data.token);

      setTimeout(() => {
        setToken(data.token);
        setCurrentUser(data.user);
        setUsernameInput('');
        setEmailInput('');
        setPasswordInput('');
        setFullnameInput('');
        setAuthSuccess('');
      }, 800);

    } catch (err: any) {
      setAuthError(err.message || 'Registration pipeline failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setUsers([]);
    setHistory([]);
    setSettings(null);
    setAuditLogs([]);
    setActiveTab('inject');
  };

  // Callback for appending newly injected history item
  const handleAddNewHistoryItem = (newItem: InjectHistory) => {
    setHistory(prev => [newItem, ...prev]);
  };

  const handleUpdateApiKey = (newKey: string) => {
    if (settings) {
      setSettings({ ...settings, api_key: newKey });
    }
  };

  // Loading indicator for INITIAL BOOTSTRAP (Prevents flickering)
  if (isInitializing) {
    return (
      <div className="h-screen w-screen bg-[#0F0F1A] text-white flex flex-col items-center justify-center space-y-4">
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-purple to-gold flex items-center justify-center animate-pulse glow-purple">
          <Zap className="h-10 w-10 text-black fill-black animate-bounce" />
        </div>
        <h1 className="text-lg font-bold tracking-tight">INJECT<span className="text-gold font-extrabold">PREMIUM</span></h1>
        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Syncing security handshake...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#0F0F1A] to-[#1A1A2E] text-slate-100 flex flex-col font-sans relative antialiased selection:bg-purple/30 selection:text-white overflow-x-hidden">
      
      {/* Decorative ambient lighting elements */}
      <div className="absolute top-10 left-1/4 w-[40rem] h-[25rem] bg-purple/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[35rem] h-[30rem] bg-gold/5 rounded-full blur-[160px] pointer-events-none -z-10" />

      <AnimatePresence mode="wait">
        
        {/* --- 1. UNAUTHENTICATED LOGIN/REGISTER SYSTEM PORTAL --- */}
        {!currentUser ? (
          <motion.div 
            key="auth-portal"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex items-center justify-center p-4 py-16"
          >
            <div className="w-full max-w-md glass-card rounded-3xl border border-white/5 relative overflow-hidden shadow-2xl p-8 space-y-6">
              
              {/* Premium Top Line Accent */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple via-gold to-purple" />
              
              {/* Brand Logo Head */}
              <div className="text-center space-y-2">
                <div className="mx-auto w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple to-gold flex items-center justify-center shadow-lg glow-purple">
                  <Zap className="h-5.5 w-5.5 text-black fill-black" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
                    INJECT<span className="text-gold font-extrabold">PREMIUM</span>
                  </h1>
                  <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Secured Authentication Gateway</p>
                </div>
              </div>

              {/* Tabs selector */}
              <div className="flex border-b border-white/5 p-1 bg-black/15 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('login');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    authTab === 'login' 
                      ? 'bg-purple/20 text-white border border-purple/35 font-bold' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('register');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    authTab === 'register' 
                      ? 'bg-purple/20 text-white border border-purple/35 font-bold' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* AUTHENTICATION FORM CLIENT */}
              <form onSubmit={authTab === 'login' ? handleLogin : handleRegister} className="space-y-4">
                
                {/* Full name (Register only) */}
                {authTab === 'register' && (
                  <div className="space-y-1.5">
                    <label htmlFor="fullname" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Nama Lengkap</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <input
                        id="fullname"
                        type="text"
                        required
                        placeholder="Nama Lengkap Kamu"
                        value={fullnameInput}
                        onChange={(e) => setFullnameInput(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2 bg-black/35 rounded-xl border border-white/10 text-xs text-white focus:outline-none focus:border-purple/50 transition"
                      />
                    </div>
                  </div>
                )}

                {/* Username Input */}
                <div className="space-y-1.5">
                  <label htmlFor="username" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <Fingerprint className="h-4 w-4" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      required
                      placeholder="Username login"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2 bg-black/35 rounded-xl border border-white/10 text-xs text-white focus:outline-none focus:border-purple/50 transition font-mono"
                    />
                  </div>
                </div>

                {/* Email address (Register only) */}
                {authTab === 'register' && (
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        required
                        placeholder="alamat@email.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2 bg-black/35 rounded-xl border border-white/10 text-xs text-white focus:outline-none focus:border-purple/50 transition font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 bg-black/35 rounded-xl border border-white/10 text-xs text-white focus:outline-none focus:border-purple/50 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Error messages feedback */}
                {authError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-sans flex items-start gap-2.5">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Success messages feedback */}
                {authSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-sans flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple to-indigo-600 hover:opacity-95 font-bold text-white text-sm transition flex items-center justify-center gap-2 glow-purple disabled:opacity-50 cursor-pointer shadow-lg active:scale-98"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Verifying with server...</span>
                    </>
                  ) : (
                    <span>{authTab === 'login' ? 'Masuk ke Dashboard' : 'Daftar Sekarang'}</span>
                  )}
                </button>
              </form>

              {/* Server default accounts details note */}
              <div className="p-3 bg-white/3 text-[10px] text-gray-500 text-center rounded-xl border border-white/3 font-sans space-y-1 select-none">
                <span className="text-gray-400 font-bold block">💡 DEFAULT PRE-SEEDED ACCOUNTS FOR SANDBOX TESTING:</span>
                <div className="flex justify-around pt-1">
                  <span>Owner login: <strong className="text-gold font-mono">owner / owner123</strong></span>
                  <span>Member login: <strong className="text-purple font-mono">member / member123</strong></span>
                </div>
              </div>

            </div>
          </motion.div>
        ) : (
          
          // --- 2. AUTHENTICATED GLOBAL DASHBOARD CONTAINER ---
          <motion.div 
            key="admin-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col md:flex-row relative"
          >
            {/* Sidebar nav controller (adaptable drawer on mobile, permanent on desktop) */}
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              user={currentUser}
              onLogout={handleLogout}
              isOpen={mobileMenuOpen}
              setIsOpen={setMobileMenuOpen}
            />

            {/* Mobile Header navbar */}
            <header className="md:hidden flex items-center justify-between px-6 py-4 bg-[#0F0F1A]/95 border-b border-white/5 sticky top-0 backdrop-blur-xl z-20">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-tr from-purple via-gold to-purple flex items-center justify-center">
                  <Zap className="h-4.5 w-4.5 text-black fill-black" />
                </div>
                <h1 className="font-sans font-bold text-sm leading-tight text-white">
                  INJECT<span className="text-gold">PREMIUM</span>
                </h1>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition"
              >
                <Menu className="h-5.5 w-5.5" />
              </button>
            </header>

            {/* Main Application interactive stage */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full md:max-h-screen">
              
              {/* Dynamic Loading Overlay for active state requests */}
              {loadingData && (
                <div className="fixed bottom-6 right-6 p-3 bg-black/80 border border-white/10 rounded-2xl flex items-center gap-2.5 shadow-2xl z-40 backdrop-blur font-mono text-[10px] text-gray-300">
                  <Loader2 className="h-4 w-4 text-purple animate-spin" />
                  <span>Synchronizing database...</span>
                </div>
              )}

              {/* View layout wrapper featuring cross-tab fade anims */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  {/* Active view selectors */}
                  {activeTab === 'dashboard' && currentUser.role === 'owner' && (
                    <DashboardView
                      users={users}
                      history={history}
                      auditLogs={auditLogs}
                      onNavigateToTab={(tab) => setActiveTab(tab)}
                    />
                  )}

                  {activeTab === 'inject' && (
                    <InjectView
                      token={token}
                      onInjectSuccess={handleAddNewHistoryItem}
                    />
                  )}

                  {activeTab === 'history' && (
                    <HistoryView
                      history={history}
                      currentUser={currentUser}
                      users={users}
                      onRefresh={syncDatabaseInfo}
                    />
                  )}

                  {activeTab === 'users' && currentUser.role === 'owner' && (
                    <ManageUsersView
                      users={users}
                      token={token}
                      currentUser={currentUser}
                      onRefresh={syncDatabaseInfo}
                      onUpdateUsersList={setUsers}
                    />
                  )}

                  {activeTab === 'settings' && currentUser.role === 'owner' && (
                    <SettingsView
                      settings={settings}
                      token={token}
                      auditLogs={auditLogs}
                      onRefresh={syncDatabaseInfo}
                      onUpdateApiKey={handleUpdateApiKey}
                    />
                  )}

                  {activeTab === 'profile' && (
                    <div className="max-w-xl mx-auto space-y-6">
                      <div className="text-center space-y-2">
                        <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple/20 to-purple/40 border border-purple/30 flex items-center justify-center font-bold text-purple text-2xl shadow-inner uppercase">
                          {currentUser.fullname.substring(0, 2)}
                        </div>
                        <h2 className="text-xl font-bold text-white">{currentUser.fullname}</h2>
                        <span className="font-mono text-xs text-purple bg-purple/10 px-3 py-1 rounded-full border border-purple/20">
                          @{currentUser.username}
                        </span>
                      </div>

                      <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
                        <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">Account Profile metadata</h3>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-gray-500 block uppercase font-bold text-[9px] mb-0.5">Full Name</span>
                            <span className="text-gray-300 font-medium">{currentUser.fullname}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block uppercase font-bold text-[9px] mb-0.5">Email</span>
                            <span className="text-gray-300 font-mono">{currentUser.email}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block uppercase font-bold text-[9px] mb-0.5">System Assigned Role</span>
                            <span className="text-gold font-bold">{currentUser.role.toUpperCase()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block uppercase font-bold text-[9px] mb-0.5">Created At (UTC)</span>
                            <span className="text-gray-400 font-mono">
                              {new Date(currentUser.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="glass-card p-6 rounded-2xl border border-purple/10 text-center space-y-2">
                        <UserCheck2 className="h-6 w-6 text-purple mx-auto" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Account Active & Checked</h4>
                        <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                          Your profile is fully linked to the Premium Bypass infrastructure gateway.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
