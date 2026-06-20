import React, { useState, useEffect, useRef } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import api from '../api';

// Types based on the backend schema
interface TriageMessageResponse {
  id: string;
  session_id: string;
  sender: 'user' | 'assistant';
  content: string;
  step_type: string;
  created_at: string;
}

interface TriageResult {
  risk_level: 'low' | 'medium' | 'high';
  score_breakdown: Record<string, any>;
  recommended_specialist: string;
  emergency_flag: boolean;
  response_text?: string;
  citations?: { source: string; excerpt: string; url?: string }[];
}

interface IntakeResponse {
  session_id: string;
  next_question: string;
  is_completed: boolean;
  result?: TriageResult;
}

export default function TriageChat() {
  const [messages, setMessages] = useState<TriageMessageResponse[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(localStorage.getItem('triageSessionId'));
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, result]);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    } else {
      startNewSession();
    }
  }, []);

  const loadSession = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/triage/sessions/${id}`);
      setMessages(res.data.messages);
      setIsCompleted(res.data.is_completed);
      if (res.data.result) {
        setResult(res.data.result);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      startNewSession();
    } finally {
      setIsLoading(false);
    }
  };

  const startNewSession = async () => {
    try {
      setIsLoading(true);
      const res = await api.post('/triage/sessions');
      const data: IntakeResponse = res.data;
      setSessionId(data.session_id);
      localStorage.setItem('triageSessionId', data.session_id);
      
      // Clear previous messages and start fresh
      setMessages([
        {
          id: 'temp-initial',
          session_id: data.session_id,
          sender: 'assistant',
          content: data.next_question,
          step_type: 'initial_complaint',
          created_at: new Date().toISOString(),
        }
      ]);
      setIsCompleted(data.is_completed);
      setResult(data.result || null);
    } catch (error) {
      console.error('Failed to start session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId || isLoading || isCompleted) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add optimistic message
    setMessages(prev => [...prev, {
      id: 'temp-user-' + Date.now(),
      session_id: sessionId,
      sender: 'user',
      content: userMessage,
      step_type: 'unknown',
      created_at: new Date().toISOString()
    }]);
    
    try {
      setIsLoading(true);
      const res = await api.post(`/triage/sessions/${sessionId}/message`, {
        content: userMessage
      });
      const data: IntakeResponse = res.data;
      
      // If there's a next question and not completed, add assistant msg
      if (data.next_question && !data.is_completed) {
        setMessages(prev => [...prev, {
          id: 'temp-assistant-' + Date.now(),
          session_id: sessionId,
          sender: 'assistant',
          content: data.next_question,
          step_type: 'generated',
          created_at: new Date().toISOString()
        }]);
      }
      
      setIsCompleted(data.is_completed);
      if (data.result) {
        setResult(data.result);
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarLayout noPadding>
      <div className="flex flex-col h-[calc(100vh)] bg-slate-50 relative">
        <div className="bg-amber-100 border-b border-amber-300 px-6 py-3 flex items-center justify-center shrink-0 z-10" data-element-id="disclaimer-banner">
          <span className="text-amber-900 text-sm font-medium text-center">
            ⚠️ This tool is not a diagnostic service. In a medical emergency, call 911 immediately.
          </span>
        </div>
        
        <div className="flex justify-end p-4 border-b border-slate-200 bg-white shrink-0">
          <button 
            onClick={startNewSession}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors"
          >
            + New Session
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6" data-element-id="messages">
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
          
          {isLoading && (
            <div className="flex max-w-[70%] self-start">
              <div className="px-5 py-4 rounded-2xl bg-white border border-slate-200 rounded-tl-sm flex gap-1.5 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
          {result && (
            <div className="self-start max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-2" data-element-id="result-card">
              {result.emergency_flag ? (
                <div className="mb-4">
                  <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold bg-red-100 text-red-800" data-element-id="risk-badge">
                    🚨 EMERGENCY ALERT
                  </span>
                </div>
              ) : (
                <div className="mb-4">
                  <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${
                    result.risk_level === 'high' ? 'bg-red-100 text-red-800' : 
                    result.risk_level === 'medium' ? 'bg-amber-100 text-amber-800' : 
                    'bg-green-100 text-green-800'
                  }`} data-element-id="risk-badge">
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
                <div className="text-xs text-slate-500 mb-6" data-element-id="citations">
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
                <button className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm" data-element-id="talk-to-doctor-btn">
                  🩺 Talk to a Doctor
                </button>
              )}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex gap-3 max-w-4xl mx-auto w-full"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your response..."
              disabled={isLoading || isCompleted}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-5 py-3.5 text-[15px] focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all disabled:opacity-60 disabled:bg-slate-100"
              data-element-id="message-input"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || isLoading || isCompleted}
              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              data-element-id="send-btn"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
}
