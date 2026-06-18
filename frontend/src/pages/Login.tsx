import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuthStore } from '../store/authStore';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Activity, ShieldCheck, HeartPulse, Lock, Mail, Stethoscope } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore(state => state.setUser);

  // 3D Parallax
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-300, 300], [5, -5]);
  const rotateY = useTransform(x, [-300, 300], [-5, 5]);

  function handleMouse(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  }
  function handleMouseLeave() { x.set(0); y.set(0); }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data = new URLSearchParams();
      data.append('username', email); // OAuth2 expects 'username'
      data.append('password', password);
      await api.post('/auth/login', data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const meResponse = await api.get('/auth/me');
      setUser(meResponse.data);
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 relative overflow-hidden">

      {/* Left Side — Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 z-10 bg-white shadow-[20px_0_40px_-10px_rgba(0,0,0,0.08)] relative">
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-brand-teal">
          <div className="bg-brand-teal/10 p-2 rounded-xl">
            <Activity className="h-5 w-5 text-brand-teal" />
          </div>
          <span className="font-extrabold tracking-wider text-brand-teal">HealthHub</span>
        </Link>

        <div className="w-full max-w-md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-3xl font-extrabold mb-2 text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 mb-8 font-medium">Please sign in to your account to continue.</p>

            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2 font-medium">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-1.5 transition-colors group-focus-within:text-brand-teal">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-brand-teal transition-colors" />
                  </div>
                  <input
                    type="email"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all text-slate-700 font-medium"
                    value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-1.5 transition-colors group-focus-within:text-brand-teal">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-brand-teal transition-colors" />
                  </div>
                  <input
                    type="password"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all text-slate-700 font-medium"
                    value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full mt-8 py-3.5 bg-brand-teal hover:bg-brand-teal-dark text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-teal/25 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isLoading ? <Activity className="w-5 h-5 animate-spin" /> : 'Sign in to Dashboard'}
              </motion.button>
            </form>

            <div className="text-center mt-8 text-sm text-slate-500 font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-teal font-bold hover:text-brand-teal-dark hover:underline ml-1 transition-colors">
                Create one
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side — Decorative 3D Panel (hidden on mobile) */}
      <div
        className="hidden lg:flex w-1/2 bg-gradient-to-br from-brand-teal-dark to-brand-teal relative items-center justify-center perspective-[1000px] overflow-hidden"
        onMouseMove={handleMouse}
        onMouseLeave={handleMouseLeave}
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />

        {/* Floating 3D Icons */}
        <motion.div
          style={{ x: useTransform(x, [-300, 300], [30, -30]), y: useTransform(y, [-300, 300], [30, -30]) }}
          animate={{ rotate: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-1/4 right-1/4 text-white/30 drop-shadow-2xl"
        >
          <HeartPulse className="w-24 h-24" />
        </motion.div>
        <motion.div
          style={{ x: useTransform(x, [-300, 300], [-40, 40]), y: useTransform(y, [-300, 300], [-40, 40]) }}
          animate={{ rotate: [0, -15, 0] }} transition={{ duration: 5, repeat: Infinity }}
          className="absolute bottom-1/4 left-1/4 text-brand-teal-light/40 drop-shadow-2xl"
        >
          <Stethoscope className="w-32 h-32" />
        </motion.div>

        {/* Central 3D Card */}
        <motion.div
          style={{ rotateX, rotateY, z: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative z-10 p-10 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20 shadow-2xl flex flex-col items-center transform-gpu"
        >
          <div className="bg-white/20 p-4 rounded-2xl mb-6 shadow-inner">
            <Activity className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight mb-2">HealthHub</h2>
          <p className="text-brand-teal-light font-medium tracking-wide text-lg text-center max-w-xs">
            Your secure gateway to smarter healthcare.
          </p>
          <div className="mt-8 flex gap-3">
            {['AI Diagnostics', 'Secure', '24/7 Care'].map(tag => (
              <span key={tag} className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full border border-white/30">{tag}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
