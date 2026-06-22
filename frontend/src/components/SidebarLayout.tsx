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
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <div className="pt-8 px-6 sm:px-10 max-w-[1600px] w-full mx-auto flex flex-wrap gap-3 items-center">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all shadow-sm ${location.pathname === link.path
                ? 'bg-slate-900 text-white shadow-slate-900/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:border-slate-300'
              }`}
          >
            {link.name}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="ml-auto px-5 py-2.5 rounded-2xl text-sm font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-all shadow-sm"
        >
          Logout
        </button>
      </div>

      <div className={`flex-1 flex flex-col ${noPadding ? '' : 'p-6 sm:p-10'} max-w-[1600px] w-full mx-auto`}>
        {children}
      </div>
    </div>
  );
}
