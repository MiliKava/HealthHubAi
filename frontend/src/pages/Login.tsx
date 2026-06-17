import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore(state => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const data = new URLSearchParams();
      data.append('username', email); // OAuth2 expects 'username'
      data.append('password', password);

      await api.post('/auth/login', data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      // Fetch user profile after login
      const meResponse = await api.get('/auth/me');
      setUser(meResponse.data);
      
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-100 p-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-900">Welcome Back</h2>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input 
              type="email" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm"
              value={email} onChange={e => setEmail(e.target.value)} required 
              placeholder="jane@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
            <input 
              type="password" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm"
              value={password} onChange={e => setPassword(e.target.value)} required 
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="w-full mt-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            Sign in
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-slate-500">
          Don't have an account? <Link to="/register" className="text-sky-500 font-medium hover:text-sky-600">Create one</Link>
        </div>
      </div>
    </div>
  );
}
