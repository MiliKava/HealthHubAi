import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import api from '../api';

interface SessionSummary {
  id: string;
  created_at: string;
  is_completed: boolean;
  risk_level?: 'low' | 'medium' | 'high';
  recommended_specialist?: string;
}

export default function SessionHistory() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await api.get('/triage/sessions');
        setSessions(response.data);
      } catch (err) {
        console.error('Failed to fetch sessions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const getRiskBadge = (risk?: string) => {
    if (risk === 'low') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Low Risk</span>;
    if (risk === 'medium') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Medium Risk</span>;
    if (risk === 'high') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">High Risk</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">Incomplete</span>;
  };

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Session History</h2>
        
        {loading ? (
          <div className="text-slate-500">Loading history...</div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <p className="text-slate-500">You have no previous triage sessions.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => (
              <div 
                key={session.id} 
                className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  if (!session.is_completed) {
                    localStorage.setItem('triageSessionId', session.id);
                    navigate('/triage');
                  } else {
                    navigate(`/history/${session.id}`);
                  }
                }}
              >
                <div>
                  <div className="text-sm text-slate-500 mb-1">
                    {new Date(session.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: 'numeric', minute: '2-digit'
                    })}
                  </div>
                  <div className="font-medium text-slate-900">
                    {session.recommended_specialist ? `Recommended: ${session.recommended_specialist}` : 'Triage Incomplete'}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getRiskBadge(session.risk_level)}
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
