import { useState, useEffect } from 'react';
import api from '../api';
import { useAuthStore } from '../store/authStore';
import SidebarLayout from '../components/SidebarLayout';

interface TriageSummary {
  risk_level: string;
  symptoms: string;
  specialist_recommendation: string;
}

interface PatientDetails {
  name: string;
  gender?: string;
  phone?: string;
}

interface AppointmentRequest {
  id: string;
  patient_id: string;
  doctor_id: string;
  triage_session_id: string;
  status: string;
  proposed_slot: string | null;
  created_at: string;
  triage_summary: TriageSummary | null;
  patient_details: PatientDetails | null;
}

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'calendar'>('requests');
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [proposedSlots, setProposedSlots] = useState<{ [key: string]: string }>({});

  const { user } = useAuthStore();

  useEffect(() => {
    fetchData();
  }, [user, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'requests') {
        const res = await api.get('/doctors/me/requests');
        // Filter to only show requested/proposed
        setRequests(res.data.filter((r: AppointmentRequest) => ['requested', 'proposed'].includes(r.status)));
      } else {
        const res = await api.get('/doctors/me/appointments');
        setAppointments(res.data);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        setError('Your account is pending admin approval or has been rejected. You cannot access the dashboard yet.');
      } else {
        setError('Failed to load data. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePropose = async (id: string) => {
    const slot = proposedSlots[id];
    if (!slot) {
      alert('Please select a date and time for the proposed slot.');
      return;
    }

    try {
      const utcSlot = new Date(slot).toISOString();
      await api.post(`/appointments/requests/${id}/accept`, { proposed_slot: utcSlot });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to propose slot. Please try again.');
    }
  };

  const handleDecline = async (id: string) => {
    if (!window.confirm('Are you sure you want to decline this request?')) return;
    try {
      await api.post(`/appointments/requests/${id}/decline`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to decline request. Please try again.');
    }
  };

  const handleSlotChange = (id: string, value: string) => {
    setProposedSlots(prev => ({ ...prev, [id]: value }));
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'TBD';
    const utcStr = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    return new Date(utcStr).toLocaleString();
  };

  return (
    <SidebarLayout noPadding>
      <div className="p-6 sm:p-10 max-w-5xl mx-auto w-full">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-10 glass-panel mac-shadow p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'requests'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900'
              }`}
          >
            📥 Incoming Requests
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'calendar'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900'
              }`}
          >
            📅 Confirmed Appointments
          </button>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-8">
          {activeTab === 'requests' ? 'Incoming Requests' : 'Confirmed Appointments'}
        </h2>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
            {error}
          </div>
        ) : loading ? (
          <div className="text-slate-500 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            Loading...
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'requests' && requests.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200">
                <span className="text-4xl mx-auto block mb-3 text-slate-300">📥</span>
                No incoming requests at the moment.
              </div>
            )}

            {activeTab === 'calendar' && appointments.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200">
                <span className="text-4xl mx-auto block mb-3 text-slate-300">📅</span>
                No confirmed appointments.
              </div>
            )}

            {activeTab === 'requests' && requests.map((req, idx) => (
              <div key={req.id} className="glass-panel mac-shadow rounded-2xl p-6 sm:p-8 transition-all hover:translate-y-[-2px]" data-element-id={`request-${idx + 1}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Patient: {req.patient_details?.name || 'Unknown'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Requested: {formatDateTime(req.created_at)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${req.status === 'requested' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                </div>

                {req.triage_summary && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-red-900 flex items-center gap-1.5">
                        <span className="text-base">⚠️</span>
                        {req.triage_summary.risk_level} Risk
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">
                      <span className="font-medium">Symptoms:</span> {req.triage_summary.symptoms}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">Recommended specialist:</span> {req.triage_summary.specialist_recommendation}
                    </p>
                  </div>
                )}

                {req.status === 'requested' && (
                  <div className="flex flex-col sm:flex-row gap-3 items-center mt-6 pt-6 border-t border-slate-200/50">
                    <input
                      type="datetime-local"
                      className="flex-1 sm:max-w-xs px-4 py-2.5 bg-white/70 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 outline-none transition-all"
                      data-element-id="slot-picker"
                      value={proposedSlots[req.id] || ''}
                      onChange={(e) => handleSlotChange(req.id, e.target.value)}
                    />
                    <button
                      onClick={() => handlePropose(req.id)}
                      data-element-id="propose-btn"
                      className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)]"
                    >
                      <span className="text-sm">✓</span>
                      Propose Slot
                    </button>
                    <button
                      onClick={() => handleDecline(req.id)}
                      data-element-id="decline-btn"
                      className="w-full sm:w-auto px-6 py-2.5 bg-white/80 hover:bg-red-50 text-red-600 border border-red-100 hover:border-red-200 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <span className="text-sm">✕</span>
                      Decline
                    </button>
                  </div>
                )}

                {req.status === 'proposed' && (
                  <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600">
                    You have proposed a slot for <span className="font-medium text-slate-900">{formatDateTime(req.proposed_slot!)}</span>. Waiting for patient confirmation.
                  </div>
                )}
              </div>
            ))}

            {activeTab === 'calendar' && appointments.map((req, idx) => (
              <div key={req.id} className="glass-panel mac-shadow rounded-2xl p-6 sm:p-8 transition-all hover:translate-y-[-2px]" data-element-id={`appointment-${idx + 1}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Patient: {req.patient_details?.name || 'Unknown'}
                    </h3>
                    <p className="text-sm font-medium text-emerald-600 mt-1 flex items-center gap-1.5">
                      <span className="text-xs">📅</span>
                      {formatDateTime(req.proposed_slot!)}
                    </p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-medium rounded-full">
                    Confirmed
                  </span>
                </div>

                {req.triage_summary && (
                  <div className="mt-4 text-sm text-slate-600 border-l-2 border-slate-200 pl-3">
                    <p><span className="font-medium text-slate-700">Symptoms:</span> {req.triage_summary.symptoms}</p>
                    <p className="mt-1"><span className="font-medium text-slate-700">Risk Level:</span> {req.triage_summary.risk_level}</p>
                  </div>
                )}
                
                <div className="mt-6 pt-6 border-t border-slate-200/50">
                  <a 
                    href={`/video-call/${req.id}`}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Join Video Call
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default DoctorDashboard;
