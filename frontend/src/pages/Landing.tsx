import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Landing: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-slate-800 font-sans selection:bg-indigo-100 relative overflow-hidden flex flex-col">
      {/* Background ambient light */}
      <div className="absolute top-0 inset-x-0 h-full overflow-hidden -z-10 pointer-events-none flex justify-center">
        <div className="absolute top-[-10%] w-[800px] h-[500px] bg-gradient-to-br from-indigo-100/40 via-blue-50/40 to-emerald-50/20 rounded-full blur-3xl opacity-70"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-rose-50/40 via-transparent to-transparent rounded-full blur-3xl opacity-60"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            {/* Rounded '+' Symbol */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-400 flex items-center justify-center shadow-md shadow-indigo-200">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">HealthHub AI</span>
          </div>

          <div className="flex items-center gap-4 font-medium">
            {isAuthenticated ? (
              <Link 
                to="/dashboard" 
                className="px-5 py-2.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="px-5 py-2.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all">
                  Sign In
                </Link>
                <Link to="/register" className="px-5 py-2.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm hover:shadow-md shadow-slate-200">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold tracking-wide mb-8 animate-fade-in-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          AI-Powered Medical Triage
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mb-6 leading-[1.1] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Calm, intelligent care.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-500">Right when you need it.</span>
        </h1>

        <p className="text-xl text-slate-500 max-w-2xl mb-12 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.2s' }}>
          Experience the future of healthcare. Get immediate AI-driven preliminary triage, discover the right specialists, and seamlessly connect via high-quality video consultations—all in one serene space.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Link 
            to={isAuthenticated ? "/dashboard" : "/register"}
            className="px-8 py-4 rounded-full bg-gradient-to-b from-slate-800 to-slate-900 text-white font-semibold text-lg hover:from-slate-700 hover:to-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
          >
            Start Your Consultation
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link 
            to="/doctors"
            className="px-8 py-4 rounded-full bg-white text-slate-700 font-semibold text-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
          >
            Browse Doctors
          </Link>
        </div>

        {/* Feature UI Preview */}
        <div className="mt-24 w-full max-w-5xl relative animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#fcfdfd] via-transparent to-transparent z-10 top-1/2"></div>
          <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-4 sm:p-6 overflow-hidden">
            <div className="w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                <div className="ml-2 text-xs font-medium text-slate-400">HealthHub AI Triage</div>
              </div>
              <img 
                src="/images/triage-preview.png" 
                alt="HealthHub AI Triage Preview" 
                className="w-full h-auto object-cover object-top max-h-[500px]"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-white py-24 relative z-10 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Everything you need for smarter healthcare</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Our platform combines cutting-edge AI with a network of verified medical professionals to deliver unparalleled care.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel mac-shadow p-8 rounded-3xl hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">AI Symptom Triage</h3>
              <p className="text-slate-500 leading-relaxed">Instantly chat with our state-of-the-art AI. It extracts medical symptoms, evaluates emergency risks, and provides a clear risk assessment using trusted medical databases.</p>
            </div>

            <div className="glass-panel mac-shadow p-8 rounded-3xl hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Verified Specialists</h3>
              <p className="text-slate-500 leading-relaxed">Based on your AI triage results, seamlessly browse and connect with highly qualified, verified doctors tailored exactly to your specific medical needs.</p>
            </div>

            <div className="glass-panel mac-shadow p-8 rounded-3xl hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Secure Video Calls</h3>
              <p className="text-slate-500 leading-relaxed">Consult with doctors via built-in, peer-to-peer WebRTC video calling. It's secure, private, and guarantees that your medical data stays completely confidential.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Network Preview Section */}
      <section className="bg-[#fcfdfd] py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-6">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Curated Medical Network
              </div>
              <h2 className="text-4xl font-bold text-slate-800 mb-6 leading-tight">Find exactly the right specialist.</h2>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Our platform takes the guesswork out of healthcare. Once the AI understands your symptoms, it instantly matches you with verified, board-certified doctors who specialize exactly in your required field.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  'Strict vetting and verification process',
                  'Transparent patient reviews and ratings',
                  'Instant booking for available slots',
                  'Direct messaging prior to consultation'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link 
                to="/doctors"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all shadow-md"
              >
                Explore Doctors
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            </div>
            <div className="lg:w-1/2 w-full">
              <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 shadow-2xl rounded-3xl p-3 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                    <div className="ml-2 text-[10px] font-medium text-slate-400">HealthHub AI Network</div>
                  </div>
                  <img 
                    src="/images/doctors-preview.png" 
                    alt="HealthHub AI Specialists Directory" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="bg-white py-24 relative z-10 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 w-full">
              <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 shadow-2xl rounded-3xl p-3 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                    <div className="ml-2 text-[10px] font-medium text-slate-400">HealthHub AI Dashboard</div>
                  </div>
                  <img 
                    src="/images/dashboard-preview.png" 
                    alt="HealthHub AI Patient Dashboard" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold mb-6">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                All-in-one Hub
              </div>
              <h2 className="text-4xl font-bold text-slate-800 mb-6 leading-tight">Your complete health command center.</h2>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Everything you need is organized in one beautifully designed, distraction-free dashboard. Track your past AI triage assessments, manage upcoming appointments, and access your secure video calls instantly.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  'Real-time appointment status updates',
                  'Comprehensive medical history tracking',
                  'One-click secure video call access',
                  'Personalized health recommendations'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-gradient-to-br from-indigo-600 to-blue-700 py-20 relative z-10 text-white">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center justify-center p-6 bg-white/10 rounded-3xl backdrop-blur-sm border border-white/20">
              <span className="text-4xl font-extrabold mb-2">98%</span>
              <span className="text-indigo-100 font-medium">Triage Accuracy</span>
            </div>
            <div className="flex flex-col items-center justify-center p-6 bg-white/10 rounded-3xl backdrop-blur-sm border border-white/20">
              <span className="text-4xl font-extrabold mb-2">&lt; 2m</span>
              <span className="text-indigo-100 font-medium">Avg. Wait Time</span>
            </div>
            <div className="flex flex-col items-center justify-center p-6 bg-white/10 rounded-3xl backdrop-blur-sm border border-white/20">
              <span className="text-4xl font-extrabold mb-2">500+</span>
              <span className="text-indigo-100 font-medium">Verified Specialists</span>
            </div>
            <div className="flex flex-col items-center justify-center p-6 bg-white/10 rounded-3xl backdrop-blur-sm border border-white/20">
              <span className="text-4xl font-extrabold mb-2">24/7</span>
              <span className="text-indigo-100 font-medium">Instant Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Banner */}
      <section className="bg-slate-900 py-16 relative z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-400 via-slate-900 to-slate-900"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold text-white mb-4">Enterprise-grade security.</h2>
            <p className="text-slate-400 text-lg">Your health data is sensitive. We use industry-standard encryption, WebRTC peer-to-peer tunnels, and strictly comply with medical data regulations.</p>
          </div>
          <div className="flex flex-wrap items-center gap-6 md:justify-end">
            <div className="glass-panel bg-white/10 border-white/10 px-6 py-4 rounded-2xl flex items-center gap-3">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <span className="text-white font-semibold">End-to-End Encrypted</span>
            </div>
            <div className="glass-panel bg-white/10 border-white/10 px-6 py-4 rounded-2xl flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-white font-semibold">HIPAA Compliant Design</span>
            </div>
          </div>
        </div>
      </section>


      {/* CSS for animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default Landing;
