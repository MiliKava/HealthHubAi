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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-100 p-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-900">Create your account</h2>
        
        <div className="flex border border-slate-200 rounded-lg mb-6 overflow-hidden">
          <button 
            type="button"
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${role === 'patient' ? 'bg-sky-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            onClick={() => setRole('patient')}
            data-element-id="patient-tab"
          >
            I'm a Patient
          </button>
          <button 
            type="button"
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${role === 'doctor' ? 'bg-sky-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            onClick={() => setRole('doctor')}
            data-element-id="doctor-tab"
          >
            I'm a Doctor
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
            <input 
              type="text" name="fullName" placeholder="Jane Smith" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm"
              value={formData.fullName} onChange={handleInputChange} required 
              data-element-id="full-name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input 
              type="email" name="email" placeholder="jane@example.com" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm"
              value={formData.email} onChange={handleInputChange} required 
              data-element-id="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
            <input 
              type="password" name="password" placeholder="••••••••" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm"
              value={formData.password} onChange={handleInputChange} required 
              data-element-id="password"
            />
          </div>

          {role === 'doctor' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Specialty</label>
                <input 
                  type="text" name="specialty" placeholder="e.g. General Practice" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm"
                  value={formData.specialty} onChange={handleInputChange} required 
                  data-element-id="specialty"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">License Number</label>
                  <input 
                    type="text" name="license" placeholder="MD-123456" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm"
                    value={formData.license} onChange={handleInputChange} required 
                    data-element-id="license"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Years Exp.</label>
                  <input 
                    type="number" name="yearsExp" placeholder="5" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm"
                    value={formData.yearsExp} onChange={handleInputChange} required 
                    data-element-id="years-exp"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Bio</label>
                <textarea 
                  name="bio" rows={3} placeholder="Brief professional bio..." 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm resize-none"
                  value={formData.bio} onChange={handleInputChange} 
                  data-element-id="bio"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Upload CV / Credentials (PDF)</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center text-slate-500 text-sm hover:bg-slate-50 transition-colors relative" data-element-id="cv-upload">
                  <input type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                  {cvFile ? <span className="text-sky-600 font-medium">{cvFile.name}</span> : <span>📄 Drag & drop or click to browse</span>}
                </div>
                {isUploading && role === 'doctor' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-sky-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={isUploading}
            className="w-full mt-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            data-element-id="register-btn"
          >
            {isUploading ? 'Processing...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-sky-500 font-medium hover:text-sky-600" data-element-id="login-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
