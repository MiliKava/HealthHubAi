import React, { useEffect, useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import api from '../api';
import { useAuthStore } from '../store/authStore';

interface ProfileData {
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  chronic_conditions: string | null;
  pregnancy_status: string | null;
}

export default function Profile() {
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
    if (role !== 'patient') {
      setLoading(false);
      return;
    }

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
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'gender' && value !== 'Female') {
        newData.pregnancy_status = 'Not applicable';
      }
      return newData;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      const payload = {
        ...formData,
        date_of_birth: formData.date_of_birth || null
      };
      
      await api.put('/patients/me/profile', payload);
      setToast({ message: 'Profile saved successfully!', type: 'success' });
      setHasProfile(true);
      setIsEditing(false);
      
      // Auto dismiss toast
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to save profile. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (role !== 'patient') {
    return (
      <SidebarLayout>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Access Denied</h2>
          <p className="text-slate-600">Only patients can manage health profiles.</p>
        </div>
      </SidebarLayout>
    );
  }

  if (loading) {
    return (
      <SidebarLayout>
        <div className="text-slate-500">Loading profile...</div>
      </SidebarLayout>
    );
  }

  if (!isEditing && hasProfile) {
    return (
      <SidebarLayout>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-2xl relative">
          {toast && (
            <div className={`absolute top-4 right-4 px-4 py-2 rounded-md shadow-sm text-sm font-medium ${
              toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {toast.message}
            </div>
          )}
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Health Profile</h2>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm"
            >
              Edit Details
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="block text-sm font-medium text-slate-500 mb-1">Date of Birth</span>
                <p className="text-slate-900">{formData.date_of_birth || 'Not provided'}</p>
              </div>
              <div>
                <span className="block text-sm font-medium text-slate-500 mb-1">Gender</span>
                <p className="text-slate-900">{formData.gender}</p>
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-500 mb-1">Phone Number</span>
              <p className="text-slate-900">{formData.phone || 'Not provided'}</p>
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-500 mb-1">Chronic Conditions</span>
              <p className="text-slate-900">{formData.chronic_conditions || 'None'}</p>
            </div>

            {formData.gender === 'Female' && (
              <div>
                <span className="block text-sm font-medium text-slate-500 mb-1">Pregnancy Status</span>
                <p className="text-slate-900">{formData.pregnancy_status}</p>
              </div>
            )}
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-2xl relative">
        {toast && (
          <div className={`absolute top-4 right-4 px-4 py-2 rounded-md shadow-sm text-sm font-medium ${
            toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {toast.message}
          </div>
        )}
        
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          {hasProfile ? 'Edit Health Profile' : 'Complete Health Profile'}
        </h2>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-slate-800"
                data-element-id="dob"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-slate-800"
                data-element-id="gender"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              placeholder="+1 555 000 0000"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-slate-800"
              data-element-id="phone"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Chronic Conditions</label>
            <textarea
              name="chronic_conditions"
              value={formData.chronic_conditions || ''}
              onChange={handleChange}
              rows={3}
              placeholder="e.g. Type 2 diabetes, hypertension..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-slate-800"
              data-element-id="chronic"
            />
          </div>

          {formData.gender === 'Female' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pregnancy Status</label>
              <select
                name="pregnancy_status"
                value={formData.pregnancy_status || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-slate-800"
                data-element-id="pregnancy"
              >
                <option value="Not applicable">Not applicable</option>
                <option value="Currently pregnant">Currently pregnant</option>
                <option value="Postpartum (within 6 months)">Postpartum (within 6 months)</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              data-element-id="save-profile"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            
            {hasProfile && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </SidebarLayout>
  );
}
