import React, { useMemo } from 'react';
import { 
  Users, 
  Zap, 
  CheckCircle2, 
  XSquare, 
  ArrowUpRight, 
  TrendingUp,
  Activity,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { motion } from 'motion/react';
import { User, InjectHistory, AuditLog } from '../types.ts';

interface DashboardViewProps {
  users: User[];
  history: InjectHistory[];
  auditLogs: AuditLog[];
  onNavigateToTab: (tab: any) => void;
}

export default function DashboardView({
  users,
  history,
  auditLogs,
  onNavigateToTab,
}: DashboardViewProps) {
  
  // Calculate analytics
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const totalInjections = history.length;
    
    // Count today's injections
    const todayStr = new Date().toISOString().substring(0, 10);
    const injectionsToday = history.filter(h => {
      return h.created_at.substring(0, 10) === todayStr;
    }).length;

    const successfulInjections = history.filter(h => h.status === 'success').length;
    const failedInjections = history.filter(h => h.status === 'failed').length;
    const successRate = totalInjections > 0 
      ? Math.round((successfulInjections / totalInjections) * 100) 
      : 0;

    const activeUsers = users.filter(u => u.status === 'active').length;
    const blockedUsers = users.filter(u => u.status === 'blocked').length;

    return {
      totalUsers,
      totalInjections,
      injectionsToday,
      successRate,
      successfulInjections,
      failedInjections,
      activeUsers,
      blockedUsers
    };
  }, [users, history]);

  // Aggregate time-series chart data for Recharts (last 7 days)
  const chartData = useMemo(() => {
    const dailyData: { [key: string]: { success: number; failed: number; label: string } } = {};
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * oneDayMs);
      const dateStr = d.toISOString().substring(0, 10);
      const labelStr = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
      dailyData[dateStr] = { success: 0, failed: 0, label: labelStr };
    }

    // Populate counts
    history.forEach(item => {
      const dateStr = item.created_at.substring(0, 10);
      if (dailyData[dateStr]) {
        if (item.status === 'success') {
          dailyData[dateStr].success++;
        } else {
          dailyData[dateStr].failed++;
        }
      }
    });

    return Object.values(dailyData);
  }, [history]);

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Top Banner section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            System Dashboard
          </h2>
          <p className="text-sm text-gray-400">
            Realtime monitoring, bypass payloads rate limits & user controls panel.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-black/15 border border-white/5 px-4 py-2 rounded-xl text-xs text-gray-300 font-mono">
          <Clock className="h-4 w-4 text-purple" />
          <span>UTC SERVER LIVE</span>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Users */}
        <motion.div 
          onClick={() => onNavigateToTab('users')}
          variants={cardVariants}
          className="glass-card glass-card-hover p-6 rounded-2xl cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-purple/5 rounded-full blur-2xl group-hover:bg-purple/10 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Total Users</span>
            <div className="p-2.5 rounded-xl bg-purple/10 text-purple border border-purple/20">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.totalUsers}</span>
            <span className="text-xs font-medium text-emerald-400 flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded">
              Active: {stats.activeUsers}
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <span>Manage logins & permissions</span>
            <ArrowUpRight className="h-3 w-3 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </motion.div>

        {/* Injections Today */}
        <motion.div 
          onClick={() => onNavigateToTab('history')}
          variants={cardVariants}
          className="glass-card glass-card-hover p-6 rounded-2xl cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-gold/5 rounded-full blur-2xl group-hover:bg-gold/10 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Bypasses Today</span>
            <div className="p-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20 glow-gold">
              <Zap className="h-5 w-5 text-gold fill-gold/10" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.injectionsToday}</span>
            <span className="text-[10px] text-gray-400">across system</span>
          </div>
          <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <span>Click to review history audits</span>
            <ArrowUpRight className="h-3 w-3 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </motion.div>

        {/* Global Success Injections */}
        <motion.div 
          onClick={() => onNavigateToTab('history')}
          variants={cardVariants}
          className="glass-card glass-card-hover p-6 rounded-2xl cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Total Injected</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.successfulInjections}</span>
            <span className="text-xs text-emerald-400 font-mono">/{stats.totalInjections} total</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">Successful premium handshakes</p>
        </motion.div>

        {/* Dispatch success rate */}
        <motion.div 
          onClick={() => onNavigateToTab('history')}
          variants={cardVariants}
          className="glass-card glass-card-hover p-6 rounded-2xl cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Inject Success Rate</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white">{stats.successRate}%</span>
            <span className="text-xs text-indigo-400 font-mono flex items-center gap-0.5">
              <span>Stable</span>
              <ShieldCheck className="h-3.5 w-3.5 fill-indigo-400/13" />
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500">API Gateway bypass fidelity</p>
        </motion.div>

      </div>

      {/* Analytics Graph & Logs Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graph Card */}
        <motion.div 
          variants={cardVariants}
          className="glass-card p-6 rounded-2xl lg:col-span-2 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple" />
              <div>
                <h3 className="text-md font-semibold text-white">System Loading Activity Chart</h3>
                <p className="text-xs text-gray-500">Bypasses logged over the last 7 active calendar days</p>
              </div>
            </div>
          </div>

          <div className="h-72 w-full pr-4">
            {stats.totalInjections === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                <Zap className="h-10 w-10 text-gray-600 mb-2 stroke-1" />
                <p className="text-sm">No injection logs exist to render graph data.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="successColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="failedColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="label" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={10} 
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#111122', 
                      borderRadius: '12px', 
                      borderColor: 'rgba(255,255,255,0.1)',
                      color: '#ffffff'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="success" 
                    stroke="#7C3AED" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#successColor)" 
                    name="Success Bypass"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="failed" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#failedColor)" 
                    name="Failed Sync"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Audit Trail List Panel */}
        <motion.div 
          variants={cardVariants}
          className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-1">
            <h3 className="text-md font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-gold" />
              <span>Security Audit Trail</span>
            </h3>
            <p className="text-xs text-gray-500">Logs of administrative credentials and updates</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[250px] my-3">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-center text-gray-600 py-10">No recent security events logged.</p>
            ) : (
              auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-black/15 border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[9px] font-semibold text-gold bg-gold/10 px-1.5 py-0.5 rounded-full border border-gold/10">
                      {log.action}
                    </span>
                    <span className="font-mono text-[9px] text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 antialiased font-sans leading-snug">
                    {log.details}
                  </p>
                  <div className="text-[9px] font-mono text-gray-500 flex items-center gap-1">
                    <span>Operator:</span>
                    <span className="text-purple">@{log.username}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button 
            onClick={() => onNavigateToTab('settings')}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-center font-medium text-gray-200 transition-colors border border-white/5 active:scale-98"
          >
            Review Dynamic Settings & Logs
          </button>
        </motion.div>

      </div>
    </motion.div>
  );
}
