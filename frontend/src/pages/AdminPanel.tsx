import { useEffect, useState } from 'react';
import api from '../api';

interface CVKeywords {
  specialty?: string;
  qualifications?: string[];
  certifications?: string[];
  languages?: string[];
  years_experience?: number;
  summary?: string;
}

interface DoctorProfile {
  id: string;
  specialty: string;
  license_number: string;
  bio?: string;
  years_experience: number;
  approval_status: string;
  cv_keywords?: CVKeywords;
}

interface Doctor {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  is_active: boolean;
  doctor_profile: DoctorProfile;
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'pending' ? '/admin/doctors/pending' : '/admin/doctors';
      const response = await api.get(endpoint);
      setDoctors(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [activeTab]);

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/admin/doctors/${id}/approve`);
      fetchDoctors();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/admin/doctors/${id}/reject`);
      fetchDoctors();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reject');
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await api.post(`/admin/doctors/${id}/deactivate`);
      fetchDoctors();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to deactivate');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <div className="w-56 bg-slate-900 text-white p-6">
        <h3 className="text-base font-semibold mb-6">Admin Panel</h3>
        <button
          onClick={() => setActiveTab('pending')}
          data-element-id="nav-pending"
          className={`block w-full text-left px-3 py-2 rounded-md mb-1 text-sm ${
            activeTab === 'pending' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          Pending Doctors
        </button>
        <button
          onClick={() => setActiveTab('all')}
          data-element-id="nav-all-doctors"
          className={`block w-full text-left px-3 py-2 rounded-md mb-1 text-sm ${
            activeTab === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          All Doctors
        </button>
      </div>

      <div className="flex-1 p-10">
        <h2 className="text-xl font-semibold mb-6">
          {activeTab === 'pending' ? 'Pending Doctor Applications' : 'All Doctors'}
        </h2>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : doctors.length === 0 ? (
          <div className="text-slate-500">No doctors found.</div>
        ) : (
          <div>
            {doctors.map(doctor => (
              <div key={doctor.id} className="bg-white rounded-lg p-6 shadow-sm mb-4 border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-base font-semibold">{doctor.full_name || 'Unnamed Doctor'}</div>
                    <div className="text-sm text-slate-500 mt-1">
                      {doctor.doctor_profile?.specialty} · {doctor.doctor_profile?.years_experience} years experience · License: {doctor.doctor_profile?.license_number}
                    </div>
                    <div className="text-sm text-slate-500">
                      Email: {doctor.email}
                    </div>
                    {doctor.created_at && (
                      <div className="text-sm text-slate-500">
                        Applied: {new Date(doctor.created_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                    doctor.doctor_profile?.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    doctor.doctor_profile?.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {doctor.doctor_profile?.approval_status?.charAt(0).toUpperCase() + doctor.doctor_profile?.approval_status?.slice(1)}
                  </span>
                </div>

                {doctor.doctor_profile?.cv_keywords && (
                  <>
                    <div className="text-sm font-medium mt-3 mb-2 text-slate-700">Extracted CV Keywords</div>
                    <div className="flex flex-wrap gap-1.5">
                      {doctor.doctor_profile.cv_keywords.qualifications?.map((q, i) => (
                        <span key={`q-${i}`} className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full text-xs">{q}</span>
                      ))}
                      {doctor.doctor_profile.cv_keywords.certifications?.map((c, i) => (
                        <span key={`c-${i}`} className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full text-xs">{c}</span>
                      ))}
                      {doctor.doctor_profile.cv_keywords.languages?.map((l, i) => (
                        <span key={`l-${i}`} className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full text-xs">{l}</span>
                      ))}
                      {doctor.doctor_profile.cv_keywords.specialty && (
                         <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full text-xs">{doctor.doctor_profile.cv_keywords.specialty}</span>
                      )}
                    </div>
                    {doctor.doctor_profile.cv_keywords.summary && (
                       <div className="text-sm text-slate-600 mt-3">{doctor.doctor_profile.cv_keywords.summary}</div>
                    )}
                  </>
                )}

                <div className="flex gap-2.5 mt-4">
                  {doctor.doctor_profile?.approval_status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(doctor.id)}
                        data-element-id="approve-btn"
                        className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleReject(doctor.id)}
                        data-element-id="reject-btn"
                        className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                      >
                        ✗ Reject
                      </button>
                    </>
                  )}
                  {activeTab === 'all' && doctor.is_active && (
                    <button
                      onClick={() => handleDeactivate(doctor.id)}
                      className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md text-sm hover:bg-slate-300"
                    >
                      Deactivate
                    </button>
                  )}
                  {activeTab === 'all' && !doctor.is_active && (
                    <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-md text-sm inline-block">
                      Deactivated
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
