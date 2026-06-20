import React from 'react';
import { 
  LayoutDashboard, 
  Zap, 
  History, 
  Users, 
  Settings, 
  User, 
  LogOut,
  X,
  Menu,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveTab, User as UserType } from '../types.ts';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: UserType | null;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  isOpen,
  setIsOpen,
}: SidebarProps) {
  if (!user) return null;

  const isOwner = user.role === 'owner';

  const menuItems = [
    ...(isOwner ? [{
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'System overview & statistics',
    }] : []),
    {
      id: 'inject' as ActiveTab,
      label: 'Inject Premium',
      icon: Zap,
      description: 'Premium subscription injector',
    },
    {
      id: 'history' as ActiveTab,
      label: isOwner ? 'All History' : 'My History',
      icon: History,
      description: isOwner ? 'Verifications log' : 'Your dispatch history',
    },
    ...(isOwner ? [{
      id: 'users' as ActiveTab,
      label: 'Manage Users',
      icon: Users,
      description: 'CRUD & access levels controls',
    }] : []),
    ...(isOwner ? [{
      id: 'settings' as ActiveTab,
      label: 'Settings API',
      icon: Settings,
      description: 'System credentials config',
    }] : []),
    {
      id: 'profile' as ActiveTab,
      label: 'My Profile',
      icon: User,
      description: 'Account settings & keys',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0F0F1A]/95 text-white border-r border-white/5 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple to-gold flex items-center justify-center glow-purple">
            <Zap className="h-5 w-5 text-black fill-black" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg tracking-tight flex items-center gap-1">
              INJECT<span className="text-gold font-sans font-extrabold">PREMIUM</span>
            </h1>
            <p className="font-mono text-[9px] text-gray-500 tracking-widest uppercase">v3.5 Premium</p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-gray-400 transition"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Profile Summary Card */}
      <div className="mx-4 my-6 p-4 rounded-xl glass-card border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-1">
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            isOwner ? 'bg-gold/10 text-gold border border-gold/20' : 'bg-purple/10 text-purple border border-purple/20'
          }`}>
            {user.role}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple/20 to-purple/40 border border-purple/30 flex items-center justify-center font-bold text-purple text-lg shadow-inner uppercase">
            {user.fullname.substring(0, 2)}
          </div>
          <div className="truncate pr-16">
            <h4 className="font-sans text-sm font-semibold truncate leading-tight text-white">{user.fullname}</h4>
            <span className="font-mono text-xs text-gray-400 leading-tight">@{user.username}</span>
          </div>
        </div>
      </div>

      {/* Navigation section */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false); // Close on mobile
              }}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3.5 group relative ${
                isActive 
                  ? 'bg-gradient-to-r from-purple/20 to-gold/10 border-l-2 border-gold text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-colors ${
                isActive 
                  ? 'text-gold' 
                  : 'text-gray-400 group-hover:text-purple'
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 truncate">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  {item.label}
                  {isActive && (
                    <motion.span 
                      layoutId="activeIndicator"
                      className="inline-block w-1.5 h-1.5 rounded-full bg-gold"
                    />
                  )}
                </div>
                <p className="text-[10px] text-gray-500 font-sans truncate">{item.description}</p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Log out */}
      <div className="p-4 border-t border-white/5 bg-black/10">
        <button
          onClick={onLogout}
          className="w-full px-4 py-3 text-left rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors group"
        >
          <LogOut className="h-5 w-5 text-gray-400 group-hover:text-red-400" />
          <div>
            <span className="text-sm font-medium block">Sign Out</span>
            <span className="text-[9px] text-gray-600 block leading-tight font-mono">End secure user session</span>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:block w-72 h-screen sticky top-0 shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Collapsible) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-30"
            />
            
            {/* Nav Menu Content Drawer Container */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 w-72 max-w-xs h-full z-40"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
