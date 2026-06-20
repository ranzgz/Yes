import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  ShieldCheck, 
  History, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';
import { AuditLog, Setting } from '../types.ts';

interface SettingsViewProps {
  settings: Setting | null;
  token: string | null;
  auditLogs: AuditLog[];
  onRefresh: () => void;
  onUpdateApiKey: (newKey: string) => void;
}

export default function SettingsView({
  settings,
  token,
  auditLogs,
  onRefresh,
  onUpdateApiKey,
}: SettingsViewProps) {
  const [apiKey, setApiKey] = useState(settings?.api_key || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Save key
  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || apiKey.trim() === '') {
      setErrorMsg('API Key cannot be blank.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await fetch('/api/settings/api-key', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ api_key: apiKey }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update system API credentials.');
      }

      setSuccessMsg('API Key successfully saved & synced!');
      onUpdateApiKey(apiKey);
      onRefresh(); // Refresh logs to list audit trail for updating api key
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while updating settings.');
    } finally {
      setLoading(false);
    }
  };

  // Filter audit logs
  const filteredLogs = auditLogs.filter(log => {
    return (
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-purple" />
            <span>Core settings & logs</span>
          </h2>
          <p className="text-sm text-gray-400">
            System configuration & secure operator logs. Use responsibly.
          </p>
        </div>
        
        <button 
          onClick={onRefresh}
          className="px-4 py-2 text-xs rounded-xl bg-white/5 border border-white/5 text-gray-300 hover:text-white flex items-center gap-2 transition hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Page</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: API Key Form */}
        <div className="lg:col-span-1 space-y-6">
          <form 
            onSubmit={handleSaveApiKey}
            className="glass-card p-6 rounded-2xl border border-white/5 space-y-6 relative overflow-hidden shadow-xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-gold uppercase tracking-wider font-mono">Integration creds</span>
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-gold" />
                <span>Bypass Gate API Key</span>
              </h3>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              Modify the secret auth hash key utilized inside the Premium Injector headers during active verifications and handshakes.
            </p>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-bold text-gray-400">System API Key</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Insert encryption key (e.g. INJECT_KEY_...)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-black/35 rounded-xl border border-white/10 text-xs text-white focus:outline-none focus:border-gold/30 font-mono transition"
                />
              </div>
            </div>

            {errorMsg && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-sans">{errorMsg}</div>}
            {successMsg && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-sans flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /><span>{successMsg}</span></div>}

            <button
              type="submit"
              disabled={loading || !apiKey}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-gold to-yellow-600 hover:opacity-95 text-xs text-black font-bold tracking-wide transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer active:scale-98"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5 text-black" />}
              <span>Update System Key</span>
            </button>
          </form>

          {/* Tips card */}
          <div className="glass-card p-6 rounded-2xl border border-gold/10 space-y-3">
            <h4 className="text-xs font-bold text-gold uppercase flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" />
              <span>Admin Security Protocol</span>
            </h4>
            <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
              All interactions on this tab trigger instant items inside the audit logs table on the right. Modifying the API key disables active sessions in-flight until verification channels are synced.
            </p>
          </div>
        </div>

        {/* Right Side: Security Audit Logs (Full) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div className="space-y-1">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple" />
                <span>Security Audit logs</span>
              </h3>
              <p className="text-xs text-gray-400">Historical records of credential updates, logins, and registrations</p>
            </div>

            {/* Audit log search input */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute inset-y-0 left-0 pl-3 h-4 w-4 text-gray-500 flex items-center pointer-events-none" />
              <input
                type="text"
                placeholder="Search actions or Operators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-black/25 rounded-lg border border-white/10 text-white outline-none text-[11px] transition focus:border-purple/50 focus:ring-1 focus:ring-purple/50"
              />
            </div>
          </div>

          {/* Scroll log container */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[450px] my-4 scrollbar">
            {filteredLogs.length === 0 ? (
              <p className="text-xs text-center text-gray-600 py-16">No audit records found.</p>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="p-4 rounded-xl bg-black/15 border border-white/5 space-y-2 hover:border-purple/20 transition">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] font-bold text-gold bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/10">
                        {log.action}
                      </span>
                      <span className="font-mono text-[10px] text-purple font-medium">Log #{log.id}</span>
                    </div>
                    <span className="font-mono text-[10px] text-gray-500">
                      {new Date(log.timestamp).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-300 font-sans leading-relaxed">
                    {log.details}
                  </p>

                  <div className="text-[10px] font-mono text-gray-500 flex items-center gap-1.5 pt-1.5 border-t border-white/2">
                    <Users className="h-3 w-3 text-gray-500" />
                    <span>Authorized Operator ID:</span>
                    <span className="text-purple block">@{log.username} (ID: {log.user_id})</span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </motion.div>
  );
}
