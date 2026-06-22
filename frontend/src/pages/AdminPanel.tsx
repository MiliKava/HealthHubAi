import { useEffect, useState } from 'react';
import api from '../api';
import SidebarLayout from '../components/SidebarLayout';

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
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/doctors');
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
  }, []);

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

  const handleActivate = async (id: string) => {
    try {
      await api.post(`/admin/doctors/${id}/activate`);
      fetchDoctors();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to activate');
    }
  };

  const pendingDoctors = doctors.filter(d => d.doctor_profile?.approval_status === 'pending');
  const approvedDoctors = doctors.filter(d => d.doctor_profile?.approval_status === 'approved');
  const rejectedDoctors = doctors.filter(d => d.doctor_profile?.approval_status === 'rejected');

  const renderDoctorCard = (doctor: Doctor, column: 'pending' | 'approved' | 'rejected') => (
    <div key={doctor.id} className="relative bg-white rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow">
      
      {/* Status Dot */}
      <div 
        className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full ${doctor.is_active ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]'}`}
        title={doctor.is_active ? "Active Account" : "Deactivated Account"}
      />

      <div className="flex justify-between items-start mb-3 pr-6">
        <div>
          <div className="text-[15px] font-semibold text-slate-900">{doctor.full_name || 'Unnamed Doctor'}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {doctor.email}
          </div>
        </div>
      </div>

      <div className="space-y-1 mb-4">
        <div className="text-sm text-slate-700">
          <span className="font-medium">Specialty:</span> {doctor.doctor_profile?.specialty}
        </div>
        <div className="text-sm text-slate-700">
          <span className="font-medium">Experience:</span> {doctor.doctor_profile?.years_experience} years
        </div>
        <div className="text-sm text-slate-700">
          <span className="font-medium">License:</span> {doctor.doctor_profile?.license_number}
        </div>
        {doctor.created_at && (
          <div className="text-xs text-slate-400 mt-2">
            Applied: {new Date(doctor.created_at).toLocaleDateString()}
          </div>
        )}
      </div>

      {doctor.doctor_profile?.cv_keywords && Object.keys(doctor.doctor_profile.cv_keywords).length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Keywords</div>
          <div className="flex flex-wrap gap-1.5">
            {doctor.doctor_profile.cv_keywords.qualifications?.map((q, i) => (
              <span key={`q-${i}`} className="bg-pink-50 text-pink-700 border border-pink-100 px-2 py-0.5 rounded-md text-[10px] font-medium">{q}</span>
            ))}
            {doctor.doctor_profile.cv_keywords.certifications?.map((c, i) => (
              <span key={`c-${i}`} className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-md text-[10px] font-medium">{c}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-slate-100">
        {column === 'pending' && (
          <>
            <button
              onClick={() => handleApprove(doctor.id)}
              className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Approve
            </button>
            <button
              onClick={() => handleReject(doctor.id)}
              className="flex-1 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Reject
            </button>
          </>
        )}
        
        {column !== 'pending' && doctor.is_active && (
          <button
            onClick={() => handleDeactivate(doctor.id)}
            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            Deactivate Access
          </button>
        )}
        
        {column !== 'pending' && !doctor.is_active && (
          <button
            onClick={() => handleActivate(doctor.id)}
            className="flex-1 py-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            Re-Activate Access
          </button>
        )}
      </div>
    </div>
  );

  return (
    <SidebarLayout noPadding>
      <div className="max-w-[1600px] mx-auto p-6 sm:p-10 pt-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Doctor Applications</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-6 shadow-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Loading applications...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Pending Column */}
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-2xl p-5 min-h-[500px]">
              <div className="flex items-center justify-between mb-5 px-1">
                <h2 className="font-semibold text-slate-800">Pending Review</h2>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {pendingDoctors.length}
                </span>
              </div>
              <div className="space-y-4">
                {pendingDoctors.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">No pending applications</div>
                ) : (
                  pendingDoctors.map(d => renderDoctorCard(d, 'pending'))
                )}
              </div>
            </div>

            {/* Approved Column */}
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-2xl p-5 min-h-[500px]">
              <div className="flex items-center justify-between mb-5 px-1">
                <h2 className="font-semibold text-slate-800">Approved</h2>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {approvedDoctors.length}
                </span>
              </div>
              <div className="space-y-4">
                {approvedDoctors.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">No approved doctors</div>
                ) : (
                  approvedDoctors.map(d => renderDoctorCard(d, 'approved'))
                )}
              </div>
            </div>

            {/* Rejected Column */}
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-2xl p-5 min-h-[500px]">
              <div className="flex items-center justify-between mb-5 px-1">
                <h2 className="font-semibold text-slate-800">Rejected</h2>
                <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {rejectedDoctors.length}
                </span>
              </div>
              <div className="space-y-4">
                {rejectedDoctors.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">No rejected doctors</div>
                ) : (
                  rejectedDoctors.map(d => renderDoctorCard(d, 'rejected'))
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
