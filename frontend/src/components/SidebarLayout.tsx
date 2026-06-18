import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Bell, Home, User, Clock, Calendar,
  Stethoscope, ShieldCheck, LogOut, ChevronUp, X
} from 'lucide-react';

interface NavLink { name: string; path: string; icon: React.ElementType }

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, role, user } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } finally {
      logout();
      navigate('/login');
    }
  };

  const baseLinks: NavLink[] = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Triage Chat', path: '/triage', icon: Stethoscope },
    { name: 'My Profile', path: '/profile', icon: User },
    { name: 'Session History', path: '/history', icon: Clock },
    { name: 'Appointments', path: '/appointments', icon: Calendar },
  ];

  const navLinks: NavLink[] = [
    ...baseLinks,
    ...(role === 'admin' ? [{ name: 'Admin Panel', path: '/admin', icon: ShieldCheck }] : []),
  ];

  // Get initials for avatar
  const initials = (user?.full_name || 'U').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">

      {/* ── Top Navbar ── */}
      <header className="h-16 bg-white border-b border-slate-100 shadow-sm flex items-center justify-between px-6 lg:px-10 z-30 sticky top-0">

        {/* Left — Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="bg-brand-teal p-2 rounded-xl shadow-sm shadow-brand-teal/30">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">HealthHub</span>
        </Link>

        {/* Center — Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ name, path, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${active
                  ? 'bg-brand-teal text-white shadow-md shadow-brand-teal/25'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {name}
              </Link>
            );
          })}
        </nav>

        {/* Right — Bell */}
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer hover:bg-slate-100 p-2 rounded-xl transition-colors">
            <Bell className="w-5 h-5 text-slate-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className="flex-1 p-6 lg:p-10 overflow-auto">
        {children}
      </main>

      {/* ── Floating Profile Circle (Bottom Right) ── */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="
  mb-3
  bg-white
  rounded-2xl
  shadow-2xl
  border border-slate-100
  overflow-hidden
  w-[90vw]
  max-w-sm
"
            >
              {/* Profile Header */}
              <div className="bg-gradient-to-br from-brand-teal-dark to-brand-teal p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center text-white font-black text-lg shadow-inner">
                    {initials}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">{user?.full_name || 'Guest User'}</p>
                    <p className="text-brand-teal-light text-xs font-semibold capitalize mt-0.5">{role}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <Link to="/profile" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-teal transition-all">
                  <User className="w-4 h-4" /> View Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all mt-1">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Circle Button */}
        {/* Profile Trigger Button - Pill Style */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setProfileOpen(prev => !prev)}
          className="
    flex items-center gap-3
    px-3 py-2
    bg-gradient-to-r from-brand-teal-dark to-brand-teal
    rounded-full
    shadow-xl shadow-brand-teal/30
    border-2 border-white
    text-white
    min-w-fit
    max-w-[260px]
  "
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-sm">
              <AnimatePresence mode="wait">
                {profileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="initials"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {initials}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Online Indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
          </div>

          {/* User Info */}
          <div className="flex flex-col items-start overflow-hidden">
            <span className="text-sm font-semibold truncate max-w-[150px]">
              {user?.full_name || "Guest User"}
            </span>

            <span className="text-[11px] text-white/80 capitalize">
              {role}
            </span>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
