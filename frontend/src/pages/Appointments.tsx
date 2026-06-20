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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatSlot = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
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
      <div className="p-8 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">My Appointments</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading appointments...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-500 shadow-sm">
            <p className="text-lg font-medium text-slate-600">No appointments found</p>
            <p className="text-sm mt-1">You have not requested any appointments yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-4" data-element-id={`request-${req.id}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">
                      {req.doctor_details?.name || 'Unknown Doctor'} — {req.doctor_details?.specialty || 'General Practitioner'}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      Requested: {formatDate(req.created_at)}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getBadgeClass(req.status)}`}>
                    {req.status === 'proposed' ? 'Slot Proposed' : req.status}
                  </span>
                </div>
                
                {req.triage_summary && (
                  <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 mb-4 border border-slate-100">
                    🩺 Triage Summary: {req.triage_summary.risk_level} Risk · {req.triage_summary.symptoms}
                  </div>
                )}
                
                {req.proposed_slot && (
                  <div className="text-sm text-slate-700 mb-4 font-medium">
                    📅 Proposed slot: {formatSlot(req.proposed_slot)}
                  </div>
                )}
                
                {req.status === 'proposed' && (
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors" data-element-id="accept-slot">
                      Accept
                    </button>
                    <button className="px-4 py-2 bg-white border border-red-500 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors" data-element-id="reject-slot">
                      Propose Another Time
                    </button>
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
