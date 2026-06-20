import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Edit, 
  Trash2, 
  ShieldAlert, 
  X, 
  CheckCircle, 
  Lock, 
  Eye, 
  EyeOff,
  User,
  Mail,
  MoreVertical,
  Loader2,
  LockKeyhole
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType } from '../types.ts';

interface ManageUsersViewProps {
  users: UserType[];
  token: string | null;
  currentUser: UserType | null;
  onRefresh: () => void;
  onUpdateUsersList: (updatedList: UserType[]) => void;
}

export default function ManageUsersView({
  users,
  token,
  currentUser,
  onRefresh,
  onUpdateUsersList,
}: ManageUsersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'member'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');

  // Modals active states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [role, setRole] = useState<'member' | 'owner'>('member');
  const [status, setStatus] = useState<'active' | 'blocked'>('active');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullname.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Open Edit Modal
  const handleOpenEdit = (user: UserType) => {
    setSelectedUser(user);
    setUsername(user.username);
    setEmail(user.email);
    setFullname(user.fullname);
    setRole(user.role);
    setStatus(user.status);
    setPassword(''); // Empty password as placeholder to reset
    setErrorMsg('');
    setSuccessMsg('');
    setShowEditModal(true);
  };

  // Open Delete Confirm Modal
  const handleOpenDelete = (user: UserType) => {
    setSelectedUser(user);
    setErrorMsg('');
    setSuccessMsg('');
    setShowDeleteConfirm(true);
  };

  // Create User API
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !fullname) {
      setErrorMsg('Please populate all required credentials.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, email, password, fullname, role, status }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user account.');
      }

      setSuccessMsg(`User @${username} created successfully!`);
      // Update local storage/list
      const newList = [...users, data.user];
      onUpdateUsersList(newList);
      
      // Reset forms and delay closing
      setTimeout(() => {
        setShowAddModal(false);
        resetFormValues();
        onRefresh(); // Pull refreshed data
      }, 1000);

    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during user creation.');
    } finally {
      setLoading(false);
    }
  };

  // Update User API
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const payload: any = { username, email, fullname, role, status };
      if (password && password.trim() !== '') {
        payload.password = password;
      }

      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to edit user account.');
      }

      setSuccessMsg('Account details updated successfully!');
      
      // Update local items list
      const updatedList = users.map(u => u.id === selectedUser.id ? data.user : u);
      onUpdateUsersList(updatedList);

      setTimeout(() => {
        setShowEditModal(false);
        resetFormValues();
        onRefresh();
      }, 1000);

    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during account modification.');
    } finally {
      setLoading(false);
    }
  };

  // Delete User API
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user.');
      }

      setSuccessMsg(data.message || 'Account successfully expunged.');
      
      // Remove from frontend list
      const updatedList = users.filter(u => u.id !== selectedUser.id);
      onUpdateUsersList(updatedList);

      setTimeout(() => {
        setShowDeleteConfirm(false);
        setSelectedUser(null);
        onRefresh();
      }, 1000);

    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during account deletion.');
    } finally {
      setLoading(false);
    }
  };

  const resetFormValues = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setFullname('');
    setRole('member');
    setStatus('active');
    setSelectedUser(null);
    setErrorMsg('');
    setSuccessMsg('');
  };

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
      {/* View Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-purple" />
            <span>Manage User Logins</span>
          </h2>
          <p className="text-sm text-gray-400">
            Administrative area: Register new members, adjust credentials, blocks, and assign Owner hierarchy.
          </p>
        </div>
        
        <button 
          onClick={() => {
            resetFormValues();
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-purple to-gold text-black shadow-lg hover:opacity-90 transition flex items-center gap-2 font-semibold cursor-pointer active:scale-98 shrink-0 self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add New Account</span>
        </button>
      </div>

      {/* Stats row cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <span className="text-[10px] text-gray-500 font-bold uppercase block tracking-wider">Total Registers</span>
          <span className="text-2xl font-extrabold text-white mt-1 block">{users.length}</span>
        </div>
        <div className="glass-card p-4 rounded-xl border-l border-gold/15">
          <span className="text-[10px] text-gray-500 font-bold uppercase block tracking-wider">System Owners</span>
          <span className="text-2xl font-extrabold text-gold mt-1 block">
            {users.filter(u => u.role === 'owner').length}
          </span>
        </div>
        <div className="glass-card p-4 rounded-xl border-l border-emerald-500/15">
          <span className="text-[10px] text-gray-500 font-bold uppercase block tracking-wider">Active Standard</span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
            {users.filter(u => u.status === 'active' && u.role === 'member').length}
          </span>
        </div>
        <div className="glass-card p-4 rounded-xl border-l border-red-500/15">
          <span className="text-[10px] text-gray-500 font-bold uppercase block tracking-wider">Blocked Accounts</span>
          <span className="text-2xl font-extrabold text-red-500 mt-1 block">
            {users.filter(u => u.status === 'blocked').length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar toolbar */}
      <div className="glass-card p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs shrink-0">
          <Search className="absolute inset-y-0 left-0 pl-3.5 h-5 w-5 text-gray-500 flex items-center pointer-events-none" />
          <input
            type="text"
            placeholder="Search by username, email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/25 rounded-xl border border-white/10 text-white outline-none text-xs transition focus:border-purple/50 focus:ring-1 focus:ring-purple/50"
          />
        </div>

        {/* Filters Select Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:justify-end">
          
          {/* Role selector filter */}
          <div className="relative shrink-0 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="appearance-none bg-[#0F0F1A] border border-white/10 rounded-xl px-4 py-2 pr-8 text-xs text-white focus:outline-none focus:border-purple/50 w-full cursor-pointer"
            >
              <option value="all">Role filter: All</option>
              <option value="owner">Owner only</option>
              <option value="member">Members only</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
              <Filter className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Status filter selector */}
          <div className="relative shrink-0 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="appearance-none bg-[#0F0F1A] border border-white/10 rounded-xl px-4 py-2 pr-8 text-xs text-white focus:outline-none focus:border-purple/50 w-full cursor-pointer"
            >
              <option value="all">Status filter: All</option>
              <option value="active">Active Accounts</option>
              <option value="blocked">Blocked Accounts</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
              <Filter className="h-3.5 w-3.5" />
            </div>
          </div>

        </div>
      </div>

      {/* Users Accounts Table Card */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto min-w-full">
          <table className="min-w-full divide-y divide-white/5 text-left text-xs text-gray-300">
            <thead className="bg-[#111122] text-gray-400 font-sans uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">ID</th>
                <th scope="col" className="px-6 py-4">User Details</th>
                <th scope="col" className="px-6 py-4">Email Address</th>
                <th scope="col" className="px-6 py-4">System Role</th>
                <th scope="col" className="px-6 py-4">Account Status</th>
                <th scope="col" className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Users className="h-8 w-8 text-gray-600 mx-auto stroke-1 mb-2.5" />
                    <p>No user accounts match the search/filter parameters.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((item) => {
                  const isSelf = item.id === currentUser?.id;
                  
                  return (
                    <tr key={item.id} className="hover:bg-white/2 transition duration-200">
                      
                      {/* ID column */}
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-[10px] text-purple">
                        #{item.id}
                      </td>

                      {/* Username Fullname */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg bg-gradient-to-br from-purple/10 to-purple/30 border border-purple/20 flex items-center justify-center font-bold text-sm text-purple uppercase truncate ${isSelf && 'border-gold/30'}`}>
                            {item.fullname.substring(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-white font-semibold leading-tight text-sm">{item.fullname}</span>
                              {isSelf && (
                                <span className="text-[8px] font-bold text-gold uppercase px-1 rounded border border-gold/20 bg-gold/10 font-mono">YOU</span>
                              )}
                            </div>
                            <span className="text-xs text-purple font-mono block">@{item.username}</span>
                          </div>
                        </div>
                      </td>

                      {/* Email info */}
                      <td className="px-6 py-4 font-mono">
                        <span className="text-gray-300 select-all">{item.email}</span>
                      </td>

                      {/* Role indicator badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                          item.role === 'owner' 
                            ? 'bg-gold/10 text-gold border-gold/20' 
                            : 'bg-purple/10 text-purple border-purple/20'
                        }`}>
                          {item.role === 'owner' ? 'Owner' : 'Member'}
                        </span>
                      </td>

                      {/* Status badge active vs blocked */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                          item.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'active' ? 'bg-emerald-400' : 'bg-red-500'}`} />
                          <span>{item.status}</span>
                        </span>
                      </td>

                      {/* Actions toolbar Edit and Delete */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
                            title="Edit user details"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleOpenDelete(item)}
                            disabled={isSelf}
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isSelf ? 'Self-deletion is disabled' : 'Delete user'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD MODAL DIALOG --- */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="w-full max-w-md glass-card border border-white/10 p-6 rounded-2xl shadow-2xl relative overflow-hidden z-20 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-purple" />
                  <span>Add New Account</span>
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-4">
                
                {/* Full name input */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe / Operator 1"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="w-full px-3.5 py-2 bg-black/35 rounded-xl border border-white/10 text-xs text-white focus:border-purple/50 focus:outline-none transition"
                  />
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="Username (minimal 3 huruf)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2 bg-black/35 rounded-xl border border-white/10 text-xs text-white focus:border-purple/50 focus:outline-none transition font-mono"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-black/35 rounded-xl border border-white/10 text-xs text-white focus:border-purple/50 focus:outline-none transition"
                  />
                </div>

                {/* Password input */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Password (minimal 5 karakter)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2 bg-black/35 rounded-xl border border-white/10 text-xs text-white focus:border-purple/50 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Role and status selects */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-gray-400">Assign Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-3.5 py-2 bg-[#0F0F1A] border border-white/10 rounded-xl text-xs text-white focus:border-purple/50 focus:outline-none transition cursor-pointer"
                    >
                      <option value="member">member</option>
                      <option value="owner">owner</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-gray-400">Initial Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2 bg-[#0F0F1A] border border-white/10 rounded-xl text-xs text-white focus:border-purple/50 focus:outline-none transition cursor-pointer"
                    >
                      <option value="active">active</option>
                      <option value="blocked">blocked</option>
                    </select>
                  </div>
                </div>

                {/* Feedback notices */}
                {errorMsg && <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 font-sans">{errorMsg}</div>}
                {successMsg && <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-sans flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /><span>{successMsg}</span></div>}

                {/* Action buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs rounded-xl bg-white/5 border border-white/5 text-gray-300 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-purple to-gold text-black shadow-lg hover:opacity-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                    <span>Confirm & Create</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EDIT MODAL DIALOG --- */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="w-full max-w-md glass-card border border-white/10 p-6 rounded-2xl shadow-2xl relative overflow-hidden z-20 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit className="h-5 w-5 text-purple" />
                  <span>Edit Account Details</span>
                </h3>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEditUser} className="space-y-4">
                
                {/* Full name */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="w-full px-3.5 py-2 bg-black/35 rounded-xl border border-white/10 text-xs text-white focus:border-purple/50 focus:outline-none transition"
                  />
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2 bg-black/35 rounded-xl border border-white/10 text-xs text-white focus:border-purple/50 focus:outline-none transition font-mono"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-black/35 rounded-xl border border-white/10 text-xs text-white focus:border-purple/50 focus:outline-none transition font-mono"
                  />
                </div>

                {/* Secret Password Reset Box */}
                <div className="p-3 bg-black/25 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gold uppercase tracking-wider">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    <span>Administrative Password Reset</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-normal">
                    Leave the field below blank if you want to retain the current password. If typed, the account's password hash will be updated.
                  </p>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new account password..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2 bg-black/35 rounded-xl border border-white/10 text-xs text-white focus:border-gold/30 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Role and status selects */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-gray-400">User Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-3.5 py-2 bg-[#0F0F1A] border border-white/10 rounded-xl text-xs text-white focus:border-purple/50 focus:outline-none transition cursor-pointer"
                    >
                      <option value="member">member</option>
                      <option value="owner">owner</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-gray-400">Account Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2 bg-[#0F0F1A] border border-white/10 rounded-xl text-xs text-white focus:border-purple/50 focus:outline-none transition cursor-pointer"
                    >
                      <option value="active">active</option>
                      <option value="blocked">blocked</option>
                    </select>
                  </div>
                </div>

                {/* Error & Success response blocks */}
                {errorMsg && <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 font-sans">{errorMsg}</div>}
                {successMsg && <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-sans flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /><span>{successMsg}</span></div>}

                {/* Action buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-xs rounded-xl bg-white/5 border border-white/5 text-gray-300 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-purple to-gold text-black shadow-lg hover:opacity-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 text-black" />}
                    <span>Save Changes</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DELETE CONFIRMATION INTERSTITIAL --- */}
      <AnimatePresence>
        {showDeleteConfirm && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            {/* Warning Dialog Card */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="w-full max-w-sm glass-card border border-red-500/20 p-6 rounded-2xl shadow-2xl relative overflow-hidden z-20 text-center space-y-5"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-red-500" />
              <div className="mx-auto w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 text-red-500" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-md font-bold text-white">Security Interstitial: Delete User!</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Are you absolutely certain you want to hard-delete user <span className="font-mono text-gold font-bold">@{selectedUser.username}</span>? This operation cannot be undone. All associated history links will lose their key mapping.
                </p>
              </div>

              {errorMsg && <div className="p-2 ml-1 rounded-lg bg-red-500/10 text-[10px] text-red-400 text-left border border-red-500/20">{errorMsg}</div>}
              {successMsg && <div className="p-2 ml-1 rounded-lg bg-emerald-500/10 text-[10px] text-emerald-400 text-left border border-emerald-500/20">{successMsg}</div>}

              {/* Confirm toolbar */}
              <div className="flex gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                  className="px-4 py-2 border border-white/5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-white/5 transition"
                >
                  No, cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-1.5 select-none"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  <span>Yes, delete user</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
