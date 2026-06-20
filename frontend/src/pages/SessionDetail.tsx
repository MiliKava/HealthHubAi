import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import api from '../api';

interface TriageMessageResponse {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
}

interface TriageResult {
  risk_level: 'low' | 'medium' | 'high';
  score_breakdown: Record<string, any>;
  recommended_specialist: string;
  emergency_flag: boolean;
  response_text?: string;
  citations?: { source: string; excerpt: string; url?: string }[];
}

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<TriageMessageResponse[]>([]);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [isCompleted, setIsCompleted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/triage/sessions/${id}`);
        setMessages(res.data.messages);
        setIsCompleted(res.data.is_completed);
        if (res.data.result) {
          setResult(res.data.result);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
        setError('Failed to load session details. It may not exist or you might not have access.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      loadSession();
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, result]);

  return (
    <SidebarLayout noPadding>
      <div className="flex flex-col h-[calc(100vh)] bg-slate-50 relative">
        <div className="flex items-center p-4 border-b border-slate-200 bg-white shrink-0 gap-4">
          <button 
            onClick={() => navigate('/history')}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors"
          >
            ← Back to History
          </button>
          <h2 className="text-lg font-bold text-slate-800">Session Details</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {isLoading ? (
            <div className="text-center text-slate-500 mt-10">Loading session...</div>
          ) : error ? (
            <div className="text-center text-red-500 mt-10">{error}</div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div key={msg.id || index} className={`flex max-w-[70%] ${msg.sender === 'user' ? 'self-end' : 'self-start'}`}>
                  <div className={`px-5 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${
                    msg.sender === 'user' 
                      ? 'bg-sky-500 text-white rounded-tr-sm' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {result && (
                <div className="self-start max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-2">
                  {result.emergency_flag ? (
                    <div className="mb-4">
                      <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold bg-red-100 text-red-800">
                        🚨 EMERGENCY ALERT
                      </span>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${
                        result.risk_level === 'high' ? 'bg-red-100 text-red-800' : 
                        result.risk_level === 'medium' ? 'bg-amber-100 text-amber-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {result.risk_level === 'high' ? '⚠️ High Risk' : 
                         result.risk_level === 'medium' ? '⚠️ Medium Risk' : 
                         '✅ Low Risk'}
                      </span>
                    </div>
                  )}
                  
                  <div className="text-[15px] leading-relaxed text-slate-700 mb-6">
                    {result.response_text ? (
                      <p className="whitespace-pre-wrap">{result.response_text}</p>
                    ) : (
                      <p>Based on your reported symptoms, your risk level is assessed as {result.risk_level}.</p>
                    )}
                    
                    {!result.emergency_flag && result.recommended_specialist && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <strong className="text-slate-900">Recommended specialist:</strong> {result.recommended_specialist}
                      </div>
                    )}
                  </div>
                  
                  {result.citations && result.citations.length > 0 && (
                    <div className="text-xs text-slate-500 mb-6">
                      <span className="font-semibold text-slate-600">📚 Sources:</span>{' '}
                      {result.citations.map((c, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && ' · '}
                          <a href={c.url || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-sky-600 hover:underline">
                            {c.source}
                          </a>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                  
                  {!result.emergency_flag && (
                    <Link 
                      to={`/doctors?specialty=${encodeURIComponent(result.recommended_specialist || '')}${id ? `&triage_session_id=${id}` : ''}`}
                      className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm block text-center" 
                      data-element-id="talk-to-doctor-btn"
                    >
                      🩺 Talk to a Doctor
                    </Link>
                  )}
                </div>
              )}
              
              {!isCompleted && !result && (
                <div className="self-center mt-6">
                  <button 
                    onClick={() => {
                      if (id) {
                        localStorage.setItem('triageSessionId', id);
                        navigate('/triage');
                      }
                    }}
                    className="bg-sky-500 hover:bg-sky-600 text-white font-medium py-3 px-6 rounded-xl transition-colors shadow-sm"
                  >
                    Resume Incomplete Session
                  </button>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
