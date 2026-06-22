import { useEffect, useState } from 'react';
import api from '../api';
import SidebarLayout from '../components/SidebarLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Stethoscope, Clock, FileText, Activity } from 'lucide-react';

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
    <motion.div
      key={doctor.id}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="relative bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-brand-teal/20 transition-all animate-none"
    >
      {/* Status Dot */}
      <div 
        className={`absolute top-5 right-5 w-2.5 h-2.5 rounded-full ${doctor.is_active ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]'}`}
        title={doctor.is_active ? "Active Account" : "Deactivated Account"}
      />

      <div className="flex items-center gap-3.5 mb-4 pr-6">
        <div className="w-10 h-10 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal font-extrabold text-sm shrink-0">
          {(doctor.full_name || 'D')[0].toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <div className="text-sm font-bold text-slate-900 truncate">{doctor.full_name || 'Unnamed Doctor'}</div>
          <div className="text-xs text-slate-500 truncate">{doctor.email}</div>
        </div>
      </div>

      <div className="space-y-2 mb-4 p-3 bg-slate-50 rounded-xl">
        <div className="text-xs text-slate-700 flex items-center gap-1.5">
          <Stethoscope className="w-3.5 h-3.5 text-brand-teal shrink-0" />
          <span className="text-slate-500 font-medium">Specialty:</span>
          <span className="font-semibold text-slate-900 truncate">{doctor.doctor_profile?.specialty || '—'}</span>
        </div>
        <div className="text-xs text-slate-700 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-brand-teal shrink-0" />
          <span className="text-slate-500 font-medium">Experience:</span>
          <span className="font-semibold text-slate-900">{doctor.doctor_profile?.years_experience || 0} years</span>
        </div>
        <div className="text-xs text-slate-700 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-brand-teal shrink-0" />
          <span className="text-slate-500 font-medium">License:</span>
          <span className="font-semibold text-slate-900 font-mono truncate">{doctor.doctor_profile?.license_number || '—'}</span>
        </div>
        {doctor.created_at && (
          <div className="text-[10px] text-slate-400 mt-2 pl-5">
            Applied: {new Date(doctor.created_at).toLocaleDateString()}
          </div>
        )}
      </div>

      {doctor.doctor_profile?.cv_keywords && Object.keys(doctor.doctor_profile.cv_keywords).length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Keywords</div>
          <div className="flex flex-wrap gap-1">
            {doctor.doctor_profile.cv_keywords.qualifications?.map((q, i) => (
              <span key={`q-${i}`} className="bg-brand-teal/10 text-brand-teal px-2 py-0.5 rounded text-[10px] font-semibold">{q}</span>
            ))}
            {doctor.doctor_profile.cv_keywords.certifications?.map((c, i) => (
              <span key={`c-${i}`} className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-semibold">{c}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-slate-100">
        {column === 'pending' && (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleApprove(doctor.id)}
              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Approve
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleReject(doctor.id)}
              className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Reject
            </motion.button>
          </>
        )}
        
        {column !== 'pending' && doctor.is_active && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDeactivate(doctor.id)}
            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Deactivate Access
          </motion.button>
        )}
        
        {column !== 'pending' && !doctor.is_active && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleActivate(doctor.id)}
            className="flex-1 py-2 bg-brand-teal hover:bg-brand-teal-dark text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            Re-Activate Access
          </motion.button>
        )}
      </div>
    </motion.div>
  );

  return (
    <SidebarLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-[1600px] mx-auto"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-brand-teal/10 rounded-xl">
            <ShieldCheck className="w-8 h-8 text-brand-teal" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Panel</h1>
            <p className="text-slate-500 mt-0.5">Manage doctor applications and platform access.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Activity className="w-10 h-10 animate-spin mb-4 text-brand-teal" />
            <p className="font-medium">Loading applications...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Pending Column */}
            <div className="bg-white/40 backdrop-blur-xl border border-slate-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-2xl p-5 min-h-[500px]">
              <div className="flex items-center justify-between mb-5 px-1">
                <h2 className="font-bold text-slate-800 text-sm">Pending Review</h2>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {pendingDoctors.length}
                </span>
              </div>
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {pendingDoctors.length === 0 ? (
                    <motion.div
                      key="empty-pending"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-10 text-slate-400 text-xs font-medium"
                    >
                      No pending applications
                    </motion.div>
                  ) : (
                    pendingDoctors.map(d => renderDoctorCard(d, 'pending'))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Approved Column */}
            <div className="bg-white/40 backdrop-blur-xl border border-slate-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-2xl p-5 min-h-[500px]">
              <div className="flex items-center justify-between mb-5 px-1">
                <h2 className="font-bold text-slate-800 text-sm">Approved</h2>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {approvedDoctors.length}
                </span>
              </div>
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {approvedDoctors.length === 0 ? (
                    <motion.div
                      key="empty-approved"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-10 text-slate-400 text-xs font-medium"
                    >
                      No approved doctors
                    </motion.div>
                  ) : (
                    approvedDoctors.map(d => renderDoctorCard(d, 'approved'))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Rejected Column */}
            <div className="bg-white/40 backdrop-blur-xl border border-slate-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-2xl p-5 min-h-[500px]">
              <div className="flex items-center justify-between mb-5 px-1">
                <h2 className="font-bold text-slate-800 text-sm">Rejected</h2>
                <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {rejectedDoctors.length}
                </span>
              </div>
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {rejectedDoctors.length === 0 ? (
                    <motion.div
                      key="empty-rejected"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-10 text-slate-400 text-xs font-medium"
                    >
                      No rejected doctors
                    </motion.div>
                  ) : (
                    rejectedDoctors.map(d => renderDoctorCard(d, 'rejected'))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </SidebarLayout>
  );
}
