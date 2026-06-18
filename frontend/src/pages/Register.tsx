import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuthStore } from '../store/authStore';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Activity, ShieldCheck, HeartPulse, Stethoscope, Lock, Mail, User, UploadCloud } from 'lucide-react';

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

  // 3D Parallax setup
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-300, 300], [5, -5]);
  const rotateY = useTransform(x, [-300, 300], [-5, 5]);

  function handleMouse(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

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
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 relative overflow-hidden">
      
      {/* Decorative Left Side (Hidden on Mobile) */}
      <div 
        className="hidden lg:flex w-1/2 bg-gradient-to-br from-brand-teal-dark to-brand-teal relative items-center justify-center perspective-[1000px] overflow-hidden"
        onMouseMove={handleMouse}
        onMouseLeave={handleMouseLeave}
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        {/* Floating 3D Icons */}
        <motion.div 
          style={{ x: useTransform(x, [-300, 300], [30, -30]), y: useTransform(y, [-300, 300], [30, -30]) }}
          animate={{ rotate: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity }} 
          className="absolute top-1/4 right-1/4 text-white/30 drop-shadow-2xl"
        >
          <Stethoscope className="w-24 h-24" />
        </motion.div>
        <motion.div 
          style={{ x: useTransform(x, [-300, 300], [-40, 40]), y: useTransform(y, [-300, 300], [-40, 40]) }}
          animate={{ rotate: [0, -15, 0] }} transition={{ duration: 5, repeat: Infinity }} 
          className="absolute bottom-1/4 left-1/4 text-brand-teal-light/40 drop-shadow-2xl"
        >
          <HeartPulse className="w-32 h-32" />
        </motion.div>

        {/* Central 3D Card */}
        <motion.div 
          style={{ rotateX, rotateY, z: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative z-10 p-10 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20 shadow-2xl flex flex-col items-center transform-gpu"
        >
          <div className="bg-white/20 p-4 rounded-2xl mb-6 shadow-inner">
            <Activity className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight mb-2">Join HealthHub</h2>
          <p className="text-brand-teal-light font-medium tracking-wide text-lg text-center max-w-xs">
            Start your journey towards a healthier tomorrow.
          </p>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 z-10 bg-white shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.1)] relative overflow-y-auto">
        <Link to="/" className="absolute top-8 left-8 lg:hidden flex items-center gap-2 text-brand-teal">
          <Activity className="h-6 w-6" />
          <span className="font-bold tracking-wider">HealthHub</span>
        </Link>

        <div className="w-full max-w-md my-auto pt-16 lg:pt-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-3xl font-extrabold mb-2 text-slate-900 tracking-tight">Create Account</h2>
            <p className="text-slate-500 mb-6 font-medium">Join us as a patient or a specialized doctor.</p>
            
            {/* Animated Role Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-8 relative">
              <button 
                type="button"
                className={`flex-1 py-2.5 text-sm font-bold transition-colors z-10 ${role === 'patient' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setRole('patient')}
                data-element-id="patient-tab"
              >
                I'm a Patient
              </button>
              <button 
                type="button"
                className={`flex-1 py-2.5 text-sm font-bold transition-colors z-10 ${role === 'doctor' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setRole('doctor')}
                data-element-id="doctor-tab"
              >
                I'm a Doctor
              </button>
              {/* Sliding Background */}
              <motion.div 
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-brand-teal rounded-lg shadow-sm"
                animate={{ left: role === 'patient' ? '4px' : 'calc(50%)' }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2 font-medium">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}
            {message && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100 flex items-center gap-2 font-medium">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                {message}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-1.5 transition-colors group-focus-within:text-brand-teal">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-brand-teal transition-colors" />
                  </div>
                  <input 
                    type="text" name="fullName" placeholder="Jane Smith" 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all text-slate-700 font-medium"
                    value={formData.fullName} onChange={handleInputChange} required 
                    data-element-id="full-name"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-1.5 transition-colors group-focus-within:text-brand-teal">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-brand-teal transition-colors" />
                  </div>
                  <input 
                    type="email" name="email" placeholder="jane@example.com" 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all text-slate-700 font-medium"
                    value={formData.email} onChange={handleInputChange} required 
                    data-element-id="email"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-1.5 transition-colors group-focus-within:text-brand-teal">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-brand-teal transition-colors" />
                  </div>
                  <input 
                    type="password" name="password" placeholder="••••••••" 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all text-slate-700 font-medium"
                    value={formData.password} onChange={handleInputChange} required 
                    data-element-id="password"
                  />
                </div>
              </div>

              <AnimatePresence>
                {role === 'doctor' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5 overflow-hidden"
                  >
                    <div className="group mt-5">
                      <label className="block text-sm font-bold text-slate-700 mb-1.5 transition-colors group-focus-within:text-brand-teal">Specialty</label>
                      <input 
                        type="text" name="specialty" placeholder="e.g. General Practice" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all text-slate-700 font-medium"
                        value={formData.specialty} onChange={handleInputChange} required 
                        data-element-id="specialty"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="group">
                        <label className="block text-sm font-bold text-slate-700 mb-1.5 transition-colors group-focus-within:text-brand-teal">License Number</label>
                        <input 
                          type="text" name="license" placeholder="MD-123456" 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all text-slate-700 font-medium"
                          value={formData.license} onChange={handleInputChange} required 
                          data-element-id="license"
                        />
                      </div>
                      <div className="group">
                        <label className="block text-sm font-bold text-slate-700 mb-1.5 transition-colors group-focus-within:text-brand-teal">Years Exp.</label>
                        <input 
                          type="number" name="yearsExp" placeholder="5" 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all text-slate-700 font-medium"
                          value={formData.yearsExp} onChange={handleInputChange} required 
                          data-element-id="years-exp"
                        />
                      </div>
                    </div>
                    
                    <div className="group">
                      <label className="block text-sm font-bold text-slate-700 mb-1.5 transition-colors group-focus-within:text-brand-teal">Bio</label>
                      <textarea 
                        name="bio" rows={3} placeholder="Brief professional bio..." 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all text-slate-700 font-medium resize-none"
                        value={formData.bio} onChange={handleInputChange} 
                        data-element-id="bio"
                      />
                    </div>
                    
                    <div className="group">
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Upload CV / Credentials (PDF)</label>
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-500 hover:border-brand-teal hover:bg-brand-teal/5 transition-all relative flex flex-col items-center justify-center gap-2 group-hover:border-brand-teal/50" data-element-id="cv-upload">
                        <input type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" required />
                        <UploadCloud className={`w-8 h-8 ${cvFile ? 'text-brand-teal' : 'text-slate-400'}`} />
                        {cvFile ? <span className="text-brand-teal font-bold">{cvFile.name}</span> : <span className="font-medium">Drag & drop or click to browse</span>}
                      </div>
                      
                      {isUploading && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                            <span className="text-brand-teal">Uploading Securely...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-brand-teal h-full rounded-full transition-all duration-300 relative" style={{ width: `${uploadProgress}%` }}>
                              <div className="absolute top-0 bottom-0 left-0 right-0 bg-white/20 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={isUploading}
                className="w-full mt-8 py-3.5 bg-brand-teal hover:bg-brand-teal-dark text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-teal/25 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center"
                data-element-id="register-btn"
              >
                {isUploading ? <Activity className="w-5 h-5 animate-spin" /> : 'Create Account'}
              </motion.button>
            </form>

            <div className="text-center mt-8 text-sm text-slate-500 font-medium pb-8 lg:pb-0">
              Already have an account? <Link to="/login" className="text-brand-teal font-bold hover:text-brand-teal-dark hover:underline ml-1 transition-colors" data-element-id="login-link">Sign in</Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
