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

  const navLinks = [
    { name: 'Triage Chat', path: '/triage' },
    { name: 'My Profile', path: '/profile' },
    { name: 'Session History', path: '/history' },
    { name: 'Appointments', path: '/appointments' },
  ];

  if (role === 'admin') {
    navLinks.push({ name: 'Admin Panel', path: '/admin' });
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <div className="w-64 bg-slate-900 text-white p-6 flex flex-col shrink-0">
        <h3 className="text-xl font-bold mb-8 tracking-tight">CareBridge AI</h3>
        <nav className="flex-1 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 font-medium"
          >
            Logout
          </button>
        </div>
      </div>
      <div className={`flex-1 flex flex-col ${noPadding ? '' : 'p-10'} overflow-hidden`}>
        {children}
      </div>
    </div>
  );
}
