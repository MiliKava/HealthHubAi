import { useEffect, useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import api from '../api';

interface TriageSummary {
  risk_level: string;
  symptoms: string;
  specialist_recommendation: string;
}

interface DoctorDetails {
  name: string;
  specialty: string;
}

interface AppointmentRequest {
  id: string;
  patient_id: string;
  doctor_id: string;
  triage_session_id: string;
  status: 'requested' | 'proposed' | 'confirmed' | 'rejected';
  proposed_slot: string | null;
  created_at: string;
  updated_at: string;
  triage_summary: TriageSummary | null;
  doctor_details: DoctorDetails | null;
}

export default function Appointments() {
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/appointments/requests');
      setRequests(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await api.post(`/appointments/requests/${id}/confirm`);
      fetchRequests();
    } catch (err) {
      console.error(err);
      setError('Failed to confirm appointment.');
    }
  };

  const handleRejectSlot = async (id: string) => {
    try {
      await api.post(`/appointments/requests/${id}/reject-slot`);
      fetchRequests();
    } catch (err) {
      console.error(err);
      setError('Failed to reject proposed slot.');
    }
  };


  const formatDate = (dateString: string) => {
    const utcStr = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    return new Date(utcStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatSlot = (dateString: string) => {
    const utcStr = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    return new Date(utcStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getBadgeClass = (status: string) => {
    switch(status) {
      case 'requested': return 'bg-sky-100 text-sky-700';
      case 'proposed': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <SidebarLayout>
      <div className="p-6 sm:p-10 max-w-5xl mx-auto w-full relative z-10">
        <h2 className="text-3xl font-bold text-slate-800 mb-8 tracking-tight">My Appointments</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 rounded-xl text-sm flex items-start gap-2">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 glass-panel mac-shadow rounded-2xl flex flex-col items-center justify-center gap-3">
             <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
             <p className="text-slate-500 font-medium">Loading appointments...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 glass-panel mac-shadow rounded-2xl flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <span className="text-3xl">📅</span>
            </div>
            <p className="text-xl font-bold text-slate-800">No appointments found</p>
            <p className="text-slate-500 mt-2">You have not requested any appointments yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="glass-panel mac-shadow rounded-2xl p-6 sm:p-8 transition-all hover:translate-y-[-2px] mb-4" data-element-id={`request-${req.id}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 shadow-sm flex items-center justify-center shrink-0">
                       <span className="text-white font-bold text-lg">{req.doctor_details?.name?.charAt(0) || 'D'}</span>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-800 tracking-tight">
                        {req.doctor_details?.name || 'Unknown Doctor'}
                      </div>
                      <div className="text-sm text-indigo-600 font-medium">
                        {req.doctor_details?.specialty || 'General Practitioner'}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Requested: {formatDate(req.created_at)}
                      </div>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm border border-white/50 ${getBadgeClass(req.status)}`}>
                    {req.status === 'proposed' ? 'Slot Proposed' : req.status}
                  </span>
                </div>
                
                {req.triage_summary && (
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 text-sm text-slate-600 mb-5 border border-slate-200/50 flex gap-3 items-start">
                    <span className="text-xl">🩺</span>
                    <div>
                      <p className="font-semibold text-slate-800 mb-0.5">Triage Summary</p>
                      <p><span className="font-medium text-indigo-600">{req.triage_summary.risk_level} Risk</span> · {req.triage_summary.symptoms}</p>
                    </div>
                  </div>
                )}
                
                {req.proposed_slot && req.status !== 'requested' && (
                  <div className="text-sm text-slate-700 mb-5 font-semibold bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 inline-block">
                    📅 {req.status === 'confirmed' ? 'Confirmed slot:' : 'Proposed slot:'} <span className="text-indigo-700">{formatSlot(req.proposed_slot)}</span>
                  </div>
                )}
                
                {req.status === 'requested' && (
                  <div className="text-sm text-amber-600 mb-5 font-medium italic">
                    Waiting for doctor to propose a time.
                  </div>
                )}
                
                {req.status === 'proposed' && (
                  <div className="flex gap-3 pt-4 border-t border-slate-200/50">
                    <button onClick={() => handleConfirm(req.id)} className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)]" data-element-id="accept-slot">
                      Accept Time
                    </button>
                    <button onClick={() => handleRejectSlot(req.id)} className="px-6 py-2.5 bg-white/80 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all shadow-sm hover:text-red-500" data-element-id="reject-slot">
                      Propose Another Time
                    </button>
                  </div>
                )}

                {req.status === 'confirmed' && (
                  <div className="mt-2 pt-5 border-t border-slate-200/50">
                    <a 
                      href={`/video-call/${req.id}`}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      Join Video Call
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
