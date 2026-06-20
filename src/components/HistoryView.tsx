import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  CheckCircle, 
  XOctagon, 
  User as UserIcon,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Mail
} from 'lucide-react';
import { motion } from 'motion/react';
import { InjectHistory, User } from '../types.ts';

interface HistoryViewProps {
  history: InjectHistory[];
  currentUser: User | null;
  users: User[];
  onRefresh: () => void;
}

export default function HistoryView({
  history,
  currentUser,
  users,
  onRefresh,
}: HistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [userFilter, setUserFilter] = useState<string>('all'); // userId as string or 'all'

  const isOwner = currentUser?.role === 'owner';

  // Apply filters on the list
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      // 1. Search term (contains email target or username)
      const matchesSearch = 
        item.email_target.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.username && item.username.toLowerCase().includes(searchTerm.toLowerCase()));

      // 2. Status filter
      const matchesStatus = 
        statusFilter === 'all' || 
        item.status === statusFilter;

      // 3. User filter (only applicable for owner, members can only see themselves anyway)
      const matchesUser = 
        !isOwner || 
        userFilter === 'all' || 
        item.user_id.toString() === userFilter;

      return matchesSearch && matchesStatus && matchesUser;
    });
  }, [history, searchTerm, statusFilter, userFilter, isOwner]);

  const stats = useMemo(() => {
    const total = filteredHistory.length;
    const success = filteredHistory.filter(h => h.status === 'success').length;
    const failed = filteredHistory.filter(h => h.status === 'failed').length;
    return { total, success, failed };
  }, [filteredHistory]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="h-6 w-6 text-purple" />
            <span>{isOwner ? 'Global Handshake Logs' : 'My License History'}</span>
          </h2>
          <p className="text-sm text-gray-400">
            {isOwner ? 'Review and audit all premium bypass licenses across clients.' : 'Check and monitor your premium bypass status records.'}
          </p>
        </div>
        
        <button 
          onClick={onRefresh}
          className="self-start sm:self-auto px-4 py-2 text-xs rounded-xl bg-white/5 border border-white/5 text-gray-300 hover:text-white flex items-center gap-2 transition hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Mini filters dashboard cell */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-xl flex items-center justify-between">
          <span className="text-xs text-gray-400 uppercase font-semibold">Logged Actions</span>
          <span className="font-mono text-lg font-bold text-white">{stats.total}</span>
        </div>
        <div className="glass-card p-4 rounded-xl flex items-center justify-between border-l border-emerald-500/10">
          <span className="text-xs text-gray-400 uppercase font-semibold">Success</span>
          <span className="font-mono text-lg font-bold text-emerald-400">{stats.success}</span>
        </div>
        <div className="glass-card p-4 rounded-xl flex items-center justify-between border-l border-red-500/10">
          <span className="text-xs text-gray-400 uppercase font-semibold">Failures</span>
          <span className="font-mono text-lg font-bold text-red-400">{stats.failed}</span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-card p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs shrink-0">
          <Search className="absolute inset-y-0 left-0 pl-3.5 h-5 w-5 text-gray-500 flex items-center pointer-events-none" />
          <input
            type="text"
            placeholder="Search email target..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/25 rounded-xl border border-white/10 text-white outline-none text-xs transition focus:border-purple/50 focus:ring-1 focus:ring-purple/50"
          />
        </div>

        {/* Filters Selects */}
        <div className="flex flex-wrap items-center gap-3 w-full md:justify-end">
          
          {/* Status filter */}
          <div className="flex items-center gap-2 bg-black/15 border border-white/5 rounded-xl p-1 shrink-0">
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === 'all' ? 'bg-purple text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              All
            </button>
            <button 
              onClick={() => setStatusFilter('success')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10' : 'text-gray-400 hover:text-white'}`}
            >
              Success
            </button>
            <button 
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === 'failed' ? 'bg-red-500/20 text-red-400 border border-red-500/10' : 'text-gray-400 hover:text-white'}`}
            >
              Failed
            </button>
          </div>

          {/* User selector (For owners only to inspect specific accounts) */}
          {isOwner && (
            <div className="relative shrink-0">
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="appearance-none bg-[#0F0F1A] border border-white/10 rounded-xl px-4 py-2 pr-8 text-xs text-white focus:outline-none focus:border-purple/50 transition cursor-pointer"
              >
                <option value="all">Filter by Operator: All</option>
                {users.map(u => (
                  <option key={u.id} value={u.id.toString()}>@{u.username} ({u.fullname})</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                <Filter className="h-3.5 w-3.5" />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Logs Table panel */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto min-w-full">
          <table className="min-w-full divide-y divide-white/5 text-left text-xs text-gray-300">
            <thead className="bg-[#111122] text-gray-400 font-sans uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">ID</th>
                <th scope="col" className="px-6 py-4">Email Target</th>
                {isOwner && <th scope="col" className="px-6 py-4">Operator Account</th>}
                <th scope="col" className="px-6 py-4">Status Handshake</th>
                <th scope="col" className="px-6 py-4">Pipeline Message</th>
                <th scope="col" className="px-6 py-4">Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={isOwner ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                    <History className="h-8 w-8 text-gray-600 mx-auto stroke-1 mb-2.5" />
                    <p>No injection logs match the active filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-white/2 transition duration-150">
                    <td className="px-6 py-4 font-mono font-medium text-purple text-[10px]">
                      #{item.id}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-white">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-gray-500" />
                        <span className="truncate max-w-[180px] md:max-w-xs" title={item.email_target}>
                          {item.email_target}
                        </span>
                      </div>
                    </td>
                    {isOwner && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-md bg-purple/10 flex items-center justify-center font-bold text-purple text-[10px] uppercase">
                            {item.username?.substring(0, 2) || 'US'}
                          </div>
                          <div>
                            <span className="text-white block font-medium">@{item.username || 'unknown'}</span>
                            <span className="text-[9px] text-gray-500 block">ID: {item.user_id}</span>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border ${
                        item.status === 'success' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {item.status === 'success' ? (
                          <>
                            <CheckCircle className="h-3 w-3 fill-emerald-400/10" />
                            <span>SUCCESS</span>
                          </>
                        ) : (
                          <>
                            <XOctagon className="h-3 w-3" />
                            <span>FAILED</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-sans text-gray-400 antialiased max-w-xs truncate" title={item.message}>
                      {item.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[11px] text-gray-400 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-500" />
                        <span>
                          {new Date(item.created_at).toLocaleString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
