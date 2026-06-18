import { useEffect, useState } from 'react';
import api from '../api';
import SidebarLayout from '../components/SidebarLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Users, Clock, ShieldCheck, Stethoscope, FileText, Activity } from 'lucide-react';

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

const statusConfig: Record<string, { label: string; className: string }> = {
  pending:  { label: 'Pending Review', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  approved: { label: 'Approved',       className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  rejected: { label: 'Rejected',       className: 'bg-red-100 text-red-800 border-red-200' },
};

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

  useEffect(() => { fetchDoctors(); }, [activeTab]);

  const handleApprove = async (id: string) => {
    try { await api.post(`/admin/doctors/${id}/approve`); fetchDoctors(); }
    catch (err: any) { alert(err.response?.data?.detail || 'Failed to approve'); }
  };

  const handleReject = async (id: string) => {
    try { await api.post(`/admin/doctors/${id}/reject`); fetchDoctors(); }
    catch (err: any) { alert(err.response?.data?.detail || 'Failed to reject'); }
  };

  const handleDeactivate = async (id: string) => {
    try { await api.post(`/admin/doctors/${id}/deactivate`); fetchDoctors(); }
    catch (err: any) { alert(err.response?.data?.detail || 'Failed to deactivate'); }
  };

  return (
    <SidebarLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-5xl mx-auto">

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-brand-teal/10 rounded-xl">
            <ShieldCheck className="w-8 h-8 text-brand-teal" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Panel</h1>
            <p className="text-slate-500 mt-0.5">Manage doctor applications and platform access.</p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-8 max-w-sm relative">
          <button onClick={() => setActiveTab('pending')} data-element-id="nav-pending"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-colors z-10 rounded-lg ${activeTab === 'pending' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}>
            <Clock className="w-4 h-4" /> Pending
          </button>
          <button onClick={() => setActiveTab('all')} data-element-id="nav-all-doctors"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-colors z-10 rounded-lg ${activeTab === 'all' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}>
            <Users className="w-4 h-4" /> All Doctors
          </button>
          <motion.div className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-brand-teal rounded-lg shadow"
            animate={{ left: activeTab === 'pending' ? '4px' : 'calc(50%)' }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-medium">{error}</div>}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Activity className="w-10 h-10 animate-spin mb-4 text-brand-teal" />
            <p className="font-medium">Loading doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-semibold text-lg">No doctors found</p>
            <p className="text-slate-400 text-sm mt-1">There are no records matching the current filter.</p>
          </motion.div>
        ) : (
          <div className="space-y-5">
            <AnimatePresence>
              {doctors.map((doctor, i) => {
                const status = statusConfig[doctor.doctor_profile?.approval_status] || statusConfig.pending;
                return (
                  <motion.div key={doctor.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-brand-teal/20 transition-all">

                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal font-black text-lg">
                          {(doctor.full_name || 'D')[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg">{doctor.full_name || 'Unnamed Doctor'}</p>
                          <p className="text-sm text-slate-500">{doctor.email}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Specialty</p>
                        <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5 text-brand-teal" />{doctor.doctor_profile?.specialty || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Experience</p>
                        <p className="text-sm font-bold text-slate-800">{doctor.doctor_profile?.years_experience || 0} years</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">License</p>
                        <p className="text-sm font-bold text-slate-800 font-mono">{doctor.doctor_profile?.license_number || '—'}</p>
                      </div>
                    </div>

                    {doctor.doctor_profile?.cv_keywords && (
                      <div className="mb-4">
                        <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Extracted CV Keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {doctor.doctor_profile.cv_keywords.qualifications?.map((q, i) => <span key={`q-${i}`} className="bg-brand-teal/10 text-brand-teal px-2.5 py-1 rounded-full text-xs font-semibold">{q}</span>)}
                          {doctor.doctor_profile.cv_keywords.certifications?.map((c, i) => <span key={`c-${i}`} className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold">{c}</span>)}
                          {doctor.doctor_profile.cv_keywords.languages?.map((l, i) => <span key={`l-${i}`} className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold">{l}</span>)}
                        </div>
                        {doctor.doctor_profile.cv_keywords.summary && <p className="text-xs text-slate-500 mt-2 leading-relaxed">{doctor.doctor_profile.cv_keywords.summary}</p>}
                      </div>
                    )}

                    <div className="flex gap-3 pt-3 border-t border-slate-100">
                      {doctor.doctor_profile?.approval_status === 'pending' && (
                        <>
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => handleApprove(doctor.id)} data-element-id="approve-btn"
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
                            <CheckCircle className="w-4 h-4" /> Approve
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => handleReject(doctor.id)} data-element-id="reject-btn"
                            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
                            <XCircle className="w-4 h-4" /> Reject
                          </motion.button>
                        </>
                      )}
                      {activeTab === 'all' && doctor.is_active && (
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={() => handleDeactivate(doctor.id)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">
                          Deactivate
                        </motion.button>
                      )}
                      {activeTab === 'all' && !doctor.is_active && (
                        <span className="px-5 py-2.5 bg-slate-50 text-slate-400 rounded-xl text-sm font-bold border border-slate-200 inline-block">Deactivated</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </SidebarLayout>
  );
}
