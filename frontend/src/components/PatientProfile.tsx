import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Calendar, Heart, Edit3, Save, X, CheckCircle, AlertCircle } from 'lucide-react';

interface ProfileData {
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  chronic_conditions: string | null;
  pregnancy_status: string | null;
}

const inputCls = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all text-slate-700 font-medium";
const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

export default function PatientProfile() {
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  
  const [formData, setFormData] = useState<ProfileData>({
    date_of_birth: '',
    gender: 'Male',
    phone: '',
    chronic_conditions: '',
    pregnancy_status: 'Not applicable'
  });

  useEffect(() => {
    if (role !== 'patient') { setLoading(false); return; }
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/patients/me/profile');
        if (data && Object.keys(data).length > 0) {
          setFormData({
            date_of_birth: data.date_of_birth || '',
            gender: data.gender || 'Male',
            phone: data.phone || '',
            chronic_conditions: data.chronic_conditions || '',
            pregnancy_status: data.pregnancy_status || 'Not applicable'
          });
          setHasProfile(true);
          setIsEditing(false);
        } else {
          setHasProfile(false);
          setIsEditing(true);
        }
      } catch (err) { console.error('Failed to load profile', err); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'gender' && value !== 'Female') newData.pregnancy_status = 'Not applicable';
      return newData;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);
    try {
      await api.put('/patients/me/profile', { ...formData, date_of_birth: formData.date_of_birth || null });
      setToast({ message: 'Profile saved successfully!', type: 'success' });
      setHasProfile(true);
      setIsEditing(false);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: 'Failed to save profile. Please try again.', type: 'error' });
    } finally { setSaving(false); }
  };

  if (role !== 'patient') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-2xl">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500">Only patients can manage health profiles.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-2xl relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20, x: 20 }} animate={{ opacity: 1, y: 0, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className={`fixed top-6 right-6 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold z-50 flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-teal/10 flex items-center justify-center">
            <User className="w-8 h-8 text-brand-teal" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Health Profile</h2>
            <p className="text-slate-500 text-sm mt-0.5">Your personal health information</p>
          </div>
        </div>
        {hasProfile && !isEditing && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal rounded-xl text-sm font-bold transition-all">
            <Edit3 className="w-4 h-4" /> Edit Details
          </motion.button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isEditing && hasProfile ? (
          <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Date of Birth', value: formData.date_of_birth || 'Not provided', icon: Calendar },
                { label: 'Gender', value: formData.gender || 'Not provided', icon: User },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                  </div>
                  <p className="text-slate-800 font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-slate-400"><Phone className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-wider">Phone Number</span></div>
              <p className="text-slate-800 font-semibold">{formData.phone || 'Not provided'}</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-slate-400"><Heart className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-wider">Chronic Conditions</span></div>
              <p className="text-slate-800 font-semibold">{formData.chronic_conditions || 'None reported'}</p>
            </div>
            {formData.gender === 'Female' && (
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-slate-400"><span className="text-xs font-bold uppercase tracking-wider">Pregnancy Status</span></div>
                <p className="text-slate-800 font-semibold">{formData.pregnancy_status}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.form key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onSubmit={handleSave} className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">
              {hasProfile ? 'Edit Your Health Profile' : 'Complete Your Health Profile'}
            </h3>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Date of Birth</label>
                <input type="date" name="date_of_birth" value={formData.date_of_birth || ''} onChange={handleChange} className={inputCls} data-element-id="dob" />
              </div>
              <div>
                <label className={labelCls}>Gender</label>
                <select name="gender" value={formData.gender || ''} onChange={handleChange} className={inputCls} data-element-id="gender">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Phone Number</label>
              <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="+1 555 000 0000" className={inputCls} data-element-id="phone" />
            </div>
            <div>
              <label className={labelCls}>Chronic Conditions</label>
              <textarea name="chronic_conditions" value={formData.chronic_conditions || ''} onChange={handleChange} rows={3}
                placeholder="e.g. Type 2 diabetes, hypertension..." className={`${inputCls} resize-none`} data-element-id="chronic" />
            </div>
            {formData.gender === 'Female' && (
              <div>
                <label className={labelCls}>Pregnancy Status</label>
                <select name="pregnancy_status" value={formData.pregnancy_status || ''} onChange={handleChange} className={inputCls} data-element-id="pregnancy">
                  <option value="Not applicable">Not applicable</option>
                  <option value="Currently pregnant">Currently pregnant</option>
                  <option value="Postpartum (within 6 months)">Postpartum (within 6 months)</option>
                </select>
              </div>
            )}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} type="submit" disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-brand-teal hover:bg-brand-teal-dark text-white font-bold rounded-xl transition-all shadow-md shadow-brand-teal/20 disabled:opacity-70" data-element-id="save-profile">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Profile'}
              </motion.button>
              {hasProfile && (
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} type="button" onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all">
                  <X className="w-4 h-4" /> Cancel
                </motion.button>
              )}
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
