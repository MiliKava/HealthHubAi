import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import api from '../api';

export default function RequestAppointment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const doctorId = searchParams.get('doctor_id');
  const triageSessionId = searchParams.get('triage_session_id');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!doctorId || !triageSessionId) {
      setError('Invalid request. Missing doctor or triage session information.');
    }
  }, [doctorId, triageSessionId]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/appointments/requests', {
        doctor_id: doctorId,
        triage_session_id: triageSessionId
      });
      navigate('/appointments');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit appointment request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Request Appointment</h2>
        
        {error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-slate-600 mb-6">
              You are about to request an appointment. Your triage summary and history will be shared with the doctor to help them prepare for your visit.
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-medium rounded-lg transition-colors"
                data-element-id="confirm-request-btn"
              >
                {loading ? 'Submitting...' : 'Confirm Request'}
              </button>
              <button 
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
