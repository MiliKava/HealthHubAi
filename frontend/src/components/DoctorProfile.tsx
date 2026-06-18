import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, FileText, UploadCloud, Edit3, Save, X, CheckCircle, AlertCircle, Award, Globe, BookOpen } from 'lucide-react';

interface CVKeywords {
  specialty: string;
  qualifications: string[];
  certifications: string[];
  languages: string[];
  years_experience: number;
  summary: string;
}

interface DoctorProfileData {
  specialty: string;
  license_number: string;
  years_experience: number;
  bio: string;
  cv_keywords?: CVKeywords;
}

const inputCls = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all text-slate-700 font-medium";
const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

export default function DoctorProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCv, setSavingCv] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<DoctorProfileData>({
    specialty: '', license_number: '', years_experience: 0, bio: ''
  });
  const [cvKeywords, setCvKeywords] = useState<CVKeywords | null>(null);
  const [cvSummary, setCvSummary] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/doctors/me/profile');
        setFormData({
          specialty: data.specialty || '', license_number: data.license_number || '',
          years_experience: data.years_experience || 0, bio: data.bio || ''
        });
        if (data.cv_keywords) { setCvKeywords(data.cv_keywords); setCvSummary(data.cv_keywords.summary || ''); }
      } catch (err) { console.error('Failed to load profile', err); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'years_experience' ? parseInt(value) || 0 : value }));
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await api.put('/doctors/me/profile', formData); showToast('Profile saved successfully!', 'success'); setIsEditing(false); }
    catch (err) { showToast('Failed to save profile.', 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveCv = async () => {
    if (!cvKeywords) return;
    setSavingCv(true);
    try {
      const updatedCv = { ...cvKeywords, summary: cvSummary };
      await api.put('/doctors/me/profile', { cv_keywords: updatedCv });
      setCvKeywords(updatedCv);
      showToast('CV Keywords saved!', 'success');
    } catch (err) { showToast('Failed to save CV keywords.', 'error'); }
    finally { setSavingCv(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') { showToast('Please upload a valid PDF file.', 'error'); return; }
    setUploading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const { data } = await api.post('/doctors/cv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCvKeywords(data); setCvSummary(data.summary || '');
      showToast('CV processed successfully!', 'success');
    } catch (err) { showToast('Failed to process CV.', 'error'); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-3xl relative">
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
            <Stethoscope className="w-8 h-8 text-brand-teal" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Doctor Profile</h2>
            <p className="text-slate-500 text-sm mt-0.5">Your professional credentials & information</p>
          </div>
        </div>
        {!isEditing && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal rounded-xl text-sm font-bold transition-all">
            <Edit3 className="w-4 h-4" /> Edit Details
          </motion.button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Specialty', value: formData.specialty || '—' },
                { label: 'License Number', value: formData.license_number || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <span className={labelCls}>{label}</span>
                  <p className="text-slate-800 font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <span className={labelCls}>Years of Experience</span>
              <p className="text-slate-800 font-semibold">{formData.years_experience} years</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <span className={labelCls}>Bio</span>
              <p className="text-slate-700 leading-relaxed">{formData.bio || 'Not provided'}</p>
            </div>
          </motion.div>
        ) : (
          <motion.form key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onSubmit={handleSaveProfile} className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm space-y-5 mb-6">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">Edit Professional Profile</h3>
            <div>
              <label className={labelCls}>Specialty</label>
              <input type="text" name="specialty" value={formData.specialty} onChange={handleChange} className={inputCls} data-element-id="specialty" />
            </div>
            <div>
              <label className={labelCls}>License Number</label>
              <input type="text" name="license_number" value={formData.license_number} onChange={handleChange} className={inputCls} data-element-id="license" />
            </div>
            <div>
              <label className={labelCls}>Years of Experience</label>
              <input type="number" name="years_experience" value={formData.years_experience} onChange={handleChange} className={inputCls} data-element-id="years-exp" />
            </div>
            <div>
              <label className={labelCls}>Bio</label>
              <textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} className={`${inputCls} resize-none`} data-element-id="bio" />
            </div>
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} type="submit" disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-brand-teal hover:bg-brand-teal-dark text-white font-bold rounded-xl transition-all shadow-md shadow-brand-teal/20 disabled:opacity-70" data-element-id="save-profile">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Profile'}
              </motion.button>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} type="button" onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all">
                <X className="w-4 h-4" /> Cancel
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* CV Keywords Section */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <FileText className="w-5 h-5 text-brand-teal" />
          <div>
            <h3 className="text-lg font-bold text-slate-800">CV / Credentials</h3>
            <p className="text-xs text-slate-400 mt-0.5">Extracted from your uploaded PDF — edit below or re-upload.</p>
          </div>
        </div>

        {cvKeywords ? (
          <div className="space-y-5 mb-6">
            {[
              { label: 'Qualifications', icon: BookOpen, items: cvKeywords.qualifications, tagClass: 'bg-brand-teal/10 text-brand-teal', id: 'qualifications-tags' },
              { label: 'Certifications', icon: Award, items: cvKeywords.certifications, tagClass: 'bg-amber-100 text-amber-700', id: 'certifications-tags' },
              { label: 'Languages', icon: Globe, items: cvKeywords.languages, tagClass: 'bg-emerald-100 text-emerald-700', id: 'languages-tags' },
            ].map(({ label, icon: Icon, items, tagClass, id }) => (
              <div key={label}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span className={labelCls}>{label}</span>
                </div>
                <div className="flex flex-wrap gap-2" data-element-id={id}>
                  {items.length > 0 ? items.map((item, i) => (
                    <span key={i} className={`${tagClass} px-3 py-1 rounded-full text-xs font-semibold`}>{item}</span>
                  )) : <span className="text-xs text-slate-400 italic">None extracted</span>}
                </div>
              </div>
            ))}
            <div>
              <label className={labelCls}>Professional Summary</label>
              <textarea value={cvSummary} onChange={e => setCvSummary(e.target.value)} rows={3}
                className={`${inputCls} resize-none`} data-element-id="cv-summary" />
            </div>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
              onClick={handleSaveCv} disabled={savingCv}
              className="flex items-center gap-2 px-5 py-2.5 border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white font-bold rounded-xl text-sm transition-all disabled:opacity-70" data-element-id="save-cv">
              {savingCv ? <div className="w-4 h-4 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {savingCv ? 'Saving...' : 'Save CV Keywords'}
            </motion.button>
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic mb-6">No CV keywords extracted yet. Upload your PDF below to get started.</p>
        )}

        <div className="pt-5 border-t border-slate-100">
          <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <motion.div whileHover={{ borderColor: '#0d9488', backgroundColor: '#f0fdfb' }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center gap-3"
            data-element-id="cv-reupload">
            <UploadCloud className={`w-10 h-10 ${uploading ? 'text-brand-teal animate-bounce' : 'text-slate-300'}`} />
            <div>
              {uploading ? (
                <span className="text-sm text-brand-teal font-bold">Processing PDF — please wait...</span>
              ) : (
                <>
                  <p className="text-sm font-bold text-slate-600">{cvKeywords ? 'Re-upload CV' : 'Upload CV'} <span className="text-brand-teal">(PDF)</span></p>
                  <p className="text-xs text-slate-400 mt-1">Click to browse or drag & drop your credentials file here</p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
