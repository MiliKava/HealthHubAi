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
      await api.post(`/appointments/requests/${id}/accept`, { proposed_slot: slot });
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

  return (
    <SidebarLayout noPadding>
      <div className="p-6 sm:p-10 max-w-5xl mx-auto w-full">
        {/* Tab Navigation */}
        <div className="flex items-center gap-3 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 w-fit">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'requests'
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
          >
            📥 Incoming Requests
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'calendar'
                ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
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
              <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow" data-element-id={`request-${idx + 1}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Patient: {req.patient_details?.name || 'Unknown'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Requested: {new Date(req.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${req.status === 'requested' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                </div>

                {req.triage_summary && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-blue-900 flex items-center gap-1.5">
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
                  <div className="flex flex-col sm:flex-row gap-3 items-center mt-5 pt-5 border-t border-slate-100">
                    <input
                      type="datetime-local"
                      className="flex-1 sm:max-w-xs px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      data-element-id="slot-picker"
                      value={proposedSlots[req.id] || ''}
                      onChange={(e) => handleSlotChange(req.id, e.target.value)}
                    />
                    <button
                      onClick={() => handlePropose(req.id)}
                      data-element-id="propose-btn"
                      className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <span className="text-sm">✓</span>
                      Propose Slot
                    </button>
                    <button
                      onClick={() => handleDecline(req.id)}
                      data-element-id="decline-btn"
                      className="w-full sm:w-auto px-5 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <span className="text-sm">✕</span>
                      Decline
                    </button>
                  </div>
                )}

                {req.status === 'proposed' && (
                  <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600">
                    You have proposed a slot for <span className="font-medium text-slate-900">{new Date(req.proposed_slot!).toLocaleString()}</span>. Waiting for patient confirmation.
                  </div>
                )}
              </div>
            ))}

            {activeTab === 'calendar' && appointments.map((req, idx) => (
              <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm" data-element-id={`appointment-${idx + 1}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Patient: {req.patient_details?.name || 'Unknown'}
                    </h3>
                    <p className="text-sm font-medium text-emerald-600 mt-1 flex items-center gap-1.5">
                      <span className="text-xs">📅</span>
                      {req.proposed_slot ? new Date(req.proposed_slot).toLocaleString() : 'TBD'}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default DoctorDashboard;
