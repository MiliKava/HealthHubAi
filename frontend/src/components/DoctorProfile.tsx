import React, { useEffect, useState, useRef } from 'react';
import api from '../api';

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

export default function DoctorProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCv, setSavingCv] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<DoctorProfileData>({
    specialty: '',
    license_number: '',
    years_experience: 0,
    bio: ''
  });

  const [cvKeywords, setCvKeywords] = useState<CVKeywords | null>(null);
  const [cvSummary, setCvSummary] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/doctors/me/profile');
        setFormData({
          specialty: data.specialty || '',
          license_number: data.license_number || '',
          years_experience: data.years_experience || 0,
          bio: data.bio || ''
        });
        if (data.cv_keywords) {
          setCvKeywords(data.cv_keywords);
          setCvSummary(data.cv_keywords.summary || '');
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'years_experience' ? parseInt(value) || 0 : value
    }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      await api.put('/doctors/me/profile', formData);
      setToast({ message: 'Profile saved successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to save profile. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCv = async () => {
    setSavingCv(true);
    setToast(null);

    try {
      if (cvKeywords) {
        const updatedCv = { ...cvKeywords, summary: cvSummary };
        await api.put('/doctors/me/profile', { cv_keywords: updatedCv });
        setCvKeywords(updatedCv);
        setToast({ message: 'CV Keywords saved successfully!', type: 'success' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to save CV keywords. Please try again.', type: 'error' });
    } finally {
      setSavingCv(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') {
      setToast({ message: 'Please upload a valid PDF file.', type: 'error' });
      return;
    }

    setUploading(true);
    setToast(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/doctors/cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCvKeywords(data);
      setCvSummary(data.summary || '');
      setToast({ message: 'CV processed successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to process CV. Please try again.', type: 'error' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return <div className="text-slate-500">Loading profile...</div>;
  }

  if (!isEditing) {
    return (
      <div className="max-w-3xl relative">
        {toast && (
          <div className={`fixed top-4 right-4 px-4 py-2 rounded-md shadow-sm text-sm font-medium z-50 ${
            toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {toast.message}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Doctor Profile</h2>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm"
          >
            Edit Details
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Professional Profile</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="block text-sm font-medium text-slate-500 mb-1">Specialty</span>
                <p className="text-slate-900">{formData.specialty || 'Not provided'}</p>
              </div>
              <div>
                <span className="block text-sm font-medium text-slate-500 mb-1">License Number</span>
                <p className="text-slate-900">{formData.license_number || 'Not provided'}</p>
              </div>
            </div>
            <div>
              <span className="block text-sm font-medium text-slate-500 mb-1">Years of Experience</span>
              <p className="text-slate-900">{formData.years_experience} years</p>
            </div>
            <div>
              <span className="block text-sm font-medium text-slate-500 mb-1">Bio</span>
              <p className="text-slate-900">{formData.bio || 'Not provided'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h3 className="text-lg font-bold text-slate-800 mb-6">CV / Credentials</h3>
          {cvKeywords ? (
            <div className="space-y-6">
              <div>
                <span className="block text-xs font-medium text-slate-500 mb-2">Qualifications</span>
                <div className="flex flex-wrap gap-2">
                  {cvKeywords.qualifications.map((q, i) => (
                    <span key={i} className="bg-sky-50 text-sky-700 px-3 py-1 rounded-full text-xs font-medium border border-sky-100">{q}</span>
                  ))}
                  {cvKeywords.qualifications.length === 0 && <span className="text-xs text-slate-400">None extracted</span>}
                </div>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 mb-2">Certifications</span>
                <div className="flex flex-wrap gap-2">
                  {cvKeywords.certifications.map((c, i) => (
                    <span key={i} className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium border border-amber-100">{c}</span>
                  ))}
                  {cvKeywords.certifications.length === 0 && <span className="text-xs text-slate-400">None extracted</span>}
                </div>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 mb-2">Languages</span>
                <div className="flex flex-wrap gap-2">
                  {cvKeywords.languages.map((l, i) => (
                    <span key={i} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium border border-emerald-100">{l}</span>
                  ))}
                  {cvKeywords.languages.length === 0 && <span className="text-xs text-slate-400">None extracted</span>}
                </div>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 mb-1">Professional Summary</span>
                <p className="text-slate-900 text-sm leading-relaxed">{cvSummary || 'None extracted'}</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic">No CV keywords extracted yet.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl relative">
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-md shadow-sm text-sm font-medium z-50 ${
          toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Edit Doctor Profile</h2>
        <button
          onClick={() => setIsEditing(false)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm"
        >
          Cancel
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Professional Profile</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
            <input
              type="text"
              name="specialty"
              value={formData.specialty}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm"
              data-element-id="specialty"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">License Number</label>
            <input
              type="text"
              name="license_number"
              value={formData.license_number}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm"
              data-element-id="license"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Years of Experience</label>
            <input
              type="number"
              name="years_experience"
              value={formData.years_experience}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm"
              data-element-id="years-exp"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm"
              data-element-id="bio"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-70"
            data-element-id="save-profile"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-2">CV / Credentials</h3>
        <p className="text-sm text-slate-500 mb-6">Extracted keywords from your CV. Edit directly or re-upload a new PDF.</p>

        {cvKeywords ? (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Qualifications</label>
              <div className="flex flex-wrap gap-2" data-element-id="qualifications-tags">
                {cvKeywords.qualifications.map((q, i) => (
                  <span key={i} className="bg-sky-50 text-sky-700 px-3 py-1 rounded-full text-xs font-medium border border-sky-100">{q}</span>
                ))}
                {cvKeywords.qualifications.length === 0 && <span className="text-xs text-slate-400">None extracted</span>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Certifications</label>
              <div className="flex flex-wrap gap-2" data-element-id="certifications-tags">
                {cvKeywords.certifications.map((c, i) => (
                  <span key={i} className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium border border-amber-100">{c}</span>
                ))}
                {cvKeywords.certifications.length === 0 && <span className="text-xs text-slate-400">None extracted</span>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Languages</label>
              <div className="flex flex-wrap gap-2" data-element-id="languages-tags">
                {cvKeywords.languages.map((l, i) => (
                  <span key={i} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium border border-emerald-100">{l}</span>
                ))}
                {cvKeywords.languages.length === 0 && <span className="text-xs text-slate-400">None extracted</span>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Professional Summary</label>
              <textarea
                value={cvSummary}
                onChange={(e) => setCvSummary(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                data-element-id="cv-summary"
              />
            </div>
            <button
              onClick={handleSaveCv}
              disabled={savingCv}
              className="px-4 py-2 border border-sky-500 text-sky-600 hover:bg-sky-50 font-medium rounded-lg text-sm transition-colors disabled:opacity-70"
              data-element-id="save-cv"
            >
              {savingCv ? 'Saving...' : 'Save CV Keywords'}
            </button>
          </div>
        ) : (
          <div className="text-sm text-slate-500 mb-6 italic">No CV keywords extracted yet.</div>
        )}

        <div className="mt-4 pt-6 border-t border-slate-100">
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-colors"
            data-element-id="cv-reupload"
          >
            {uploading ? (
              <span className="text-sm text-sky-600 font-medium">Processing PDF...</span>
            ) : (
              <span className="text-sm text-slate-500 font-medium">📄 Re-upload CV PDF to re-extract keywords</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
