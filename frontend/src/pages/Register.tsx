import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    specialty: '',
    license: '',
    yearsExp: '',
    bio: ''
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore(state => state.setUser);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCvFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;
    
    setError('');
    setMessage('');
    setUploadProgress(0);
    try {
      if (role === 'patient') {
        setIsUploading(true);
        const payload = {
          full_name: formData.fullName,
          email: formData.email,
          password: formData.password
        };
        const response = await api.post('/auth/register/patient', payload);
        setUser(response.data);
        navigate('/');
      } else {
        if (!cvFile) {
          setError('CV file is required for doctors.');
          return;
        }
        setIsUploading(true);
        const data = new FormData();
        data.append('full_name', formData.fullName);
        data.append('email', formData.email);
        data.append('password', formData.password);
        data.append('specialty', formData.specialty);
        data.append('license_number', formData.license);
        data.append('years_experience', formData.yearsExp);
        data.append('bio', formData.bio);
        data.append('cv_file', cvFile);

        const response = await api.post('/auth/register/doctor', data, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
            }
          }
        });
        setMessage(response.data.message);
        
        // Clear form after success
        setFormData({
          fullName: '', email: '', password: '', specialty: '', license: '', yearsExp: '', bio: ''
        });
        setCvFile(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden py-12">
      {/* Decorative background blur elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob pointer-events-none"></div>
      <div className="fixed top-[20%] right-[-10%] w-[500px] h-[500px] bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="fixed bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-sky-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000 pointer-events-none"></div>

      <div className="w-full max-w-[500px] glass-panel mac-shadow rounded-2xl p-8 sm:p-10 z-10 relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-400 shadow-lg shadow-indigo-200 mb-4 hover:scale-105 transition-transform cursor-pointer" onClick={() => navigate('/')}>
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Create an Account</h2>
          <p className="text-sm text-slate-500 mt-1">Join HealthHub AI</p>
        </div>
        
        <div className="flex bg-slate-100/60 backdrop-blur-md p-1 rounded-xl mb-8 border border-slate-200/50">
          <button 
            type="button"
            className={`flex-1 py-2.5 text-sm font-semibold transition-all rounded-lg ${role === 'patient' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setRole('patient')}
            data-element-id="patient-tab"
          >
            I'm a Patient
          </button>
          <button 
            type="button"
            className={`flex-1 py-2.5 text-sm font-semibold transition-all rounded-lg ${role === 'doctor' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setRole('doctor')}
            data-element-id="doctor-tab"
          >
            I'm a Doctor
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 rounded-xl text-sm flex items-start gap-2">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="mb-6 p-3.5 bg-emerald-50/80 backdrop-blur-sm border border-emerald-100 text-emerald-700 rounded-xl text-sm flex items-start gap-2">
            <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Full Name</label>
            <input 
              type="text" name="fullName" placeholder="Jane Doe" 
              className="w-full px-4 py-2.5 bg-white/70 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all text-sm placeholder:text-slate-400"
              value={formData.fullName} onChange={handleInputChange} required 
              data-element-id="full-name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Email</label>
            <input 
              type="email" name="email" placeholder="jane@example.com" 
              className="w-full px-4 py-2.5 bg-white/70 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all text-sm placeholder:text-slate-400"
              value={formData.email} onChange={handleInputChange} required 
              data-element-id="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Password</label>
            <input 
              type="password" name="password" placeholder="••••••••" 
              className="w-full px-4 py-2.5 bg-white/70 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all text-sm placeholder:text-slate-400"
              value={formData.password} onChange={handleInputChange} required minLength={8}
              data-element-id="password"
            />
            <p className="text-xs text-slate-400 mt-1.5 ml-1">Must be at least 8 characters</p>
          </div>

          {role === 'doctor' && (
            <div className="space-y-5 pt-2 mt-2 border-t border-slate-100">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
                <p className="font-semibold mb-1 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Doctor Registration
                </p>
                <p className="text-indigo-700/80 text-xs">After registration, you will need to complete your profile and upload your CV for administrator approval.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Specialty</label>
                <input 
                  type="text" name="specialty" placeholder="e.g. General Practice" 
                  className="w-full px-4 py-2.5 bg-white/70 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all text-sm placeholder:text-slate-400"
                  value={formData.specialty} onChange={handleInputChange} required 
                  data-element-id="specialty"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">License Number</label>
                  <input 
                    type="text" name="license" placeholder="MD-123456" 
                    className="w-full px-4 py-2.5 bg-white/70 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all text-sm placeholder:text-slate-400"
                    value={formData.license} onChange={handleInputChange} required 
                    data-element-id="license"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Years Exp.</label>
                  <input 
                    type="number" name="yearsExp" placeholder="5" 
                    className="w-full px-4 py-2.5 bg-white/70 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all text-sm placeholder:text-slate-400"
                    value={formData.yearsExp} onChange={handleInputChange} required 
                    data-element-id="years-exp"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Bio</label>
                <textarea 
                  name="bio" rows={3} placeholder="Brief professional bio..." 
                  className="w-full px-4 py-2.5 bg-white/70 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all text-sm resize-none placeholder:text-slate-400"
                  value={formData.bio} onChange={handleInputChange} 
                  data-element-id="bio"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Upload CV / Credentials (PDF)</label>
                <div className="border-2 border-dashed border-slate-300 bg-white/50 rounded-xl p-6 text-center text-slate-500 text-sm hover:bg-white transition-colors relative" data-element-id="cv-upload">
                  <input type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                  {cvFile ? <span className="text-indigo-600 font-semibold">{cvFile.name}</span> : <span>📄 Drag & drop or click to browse</span>}
                </div>
                {isUploading && role === 'doctor' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-indigo-500 to-sky-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isUploading}
            className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-semibold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            data-element-id="register-btn"
          >
            {isUploading ? 'Processing...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-8 text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-indigo-500 font-semibold hover:text-indigo-600 transition-colors" data-element-id="login-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
