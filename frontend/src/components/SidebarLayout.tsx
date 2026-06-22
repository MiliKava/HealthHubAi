import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api';

export default function SidebarLayout({ children, noPadding = false }: { children: React.ReactNode, noPadding?: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, role } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      logout();
      navigate('/login');
    }
  };

  let navLinks: { name: string, path: string }[] = [];

  if (role === 'patient') {
    navLinks = [
      { name: 'Dashboard', path: '/' },
      { name: 'Triage Chat', path: '/triage' },
      { name: 'History', path: '/history' },
      { name: 'Appointments', path: '/appointments' },
      { name: 'Doctors', path: '/doctors' },
      { name: 'Profile', path: '/profile' },
    ];
  } else if (role === 'doctor') {
    navLinks = [
      { name: 'Dashboard', path: '/doctor/dashboard' },
      { name: 'Profile', path: '/profile' },
    ];
  } else if (role === 'admin') {
    navLinks = [
      { name: 'Dashboard', path: '/' },
      { name: 'Admin Panel', path: '/admin' },
      { name: 'Profile', path: '/profile' },
    ];
  } else {
    navLinks = [
      { name: 'Dashboard', path: '/' },
      { name: 'Profile', path: '/profile' },
    ];
  }

  return (
    <div className="min-h-screen bg-transparent font-sans flex flex-col relative overflow-hidden">
      {/* Decorative background blur elements globally for the app */}
      <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-sky-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>

      <div className="sticky top-0 z-50 pt-6 px-6 sm:px-10 max-w-[1600px] w-full mx-auto flex flex-wrap gap-4 items-center">
        {/* HealthHub AI Logo */}
        <div 
          onClick={() => navigate(role === 'doctor' ? '/doctor/dashboard' : '/')} 
          className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-400 cursor-pointer shadow-lg shadow-indigo-200 hover:scale-105 transition-transform"
          title="Home"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>

        {/* Navigation Links */}
        <div className="flex gap-2 p-1.5 glass-panel rounded-2xl mac-shadow">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${location.pathname === link.path
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="ml-auto px-6 py-3 rounded-2xl text-sm font-semibold glass-panel text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all mac-shadow"
        >
          Logout
        </button>
      </div>

      <div className={`flex-1 flex flex-col ${noPadding ? '' : 'p-6 sm:p-10'} max-w-[1600px] w-full mx-auto relative z-10`}>
        {children}
      </div>
    </div>
  );
}
