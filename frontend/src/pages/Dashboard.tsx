import { useAuthStore } from '../store/authStore';
import SidebarLayout from '../components/SidebarLayout';
import { Navigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, role } = useAuthStore();

  const isPendingDoctor = role === 'doctor' && user?.doctor_profile?.approval_status === 'pending';
  const isRejectedDoctor = role === 'doctor' && user?.doctor_profile?.approval_status === 'rejected';

  if (isRejectedDoctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl border border-red-200 shadow-sm max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">✗</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Application Rejected</h2>
          <p className="text-slate-600 mb-6">
            We're sorry, but your application to join HealthHub AI as a doctor has been rejected. You cannot access the doctor dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (role === 'doctor' && !isPendingDoctor && !isRejectedDoctor) {
    console.log("Dashboard redirecting to /doctor/dashboard");
    return <Navigate to="/doctor/dashboard" replace />;
  }

  console.log("Dashboard rendering normally", { role, isPendingDoctor, isRejectedDoctor, profile: user?.doctor_profile });

  return (
    <SidebarLayout>
      <div className="max-w-4xl">
        {isPendingDoctor && (
          <div className="bg-amber-50 border border-amber-200 px-6 py-4 rounded-xl mb-6">
            <p className="text-amber-800 text-sm font-medium">
              ⚠️ Your application is currently under review by an administrator. You will not be able to access doctor features until approved.
            </p>
          </div>
        )}

        <h2 className="text-3xl font-bold text-slate-800 mb-8 tracking-tight">Welcome back, {user?.full_name}</h2>
        
        <div className="glass-panel mac-shadow p-8 rounded-2xl transition-all hover:translate-y-[-2px]">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-500 shadow-md mb-6 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 mb-3">Your HealthHub AI Portal</h3>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Welcome to the HealthHub AI ecosystem. From here, you can access the Triage Chat to get an immediate AI assessment, view your appointment history, or browse available doctors.
          </p>
          
          {role === 'patient' && (
            <div className="flex gap-4">
              <a href="/triage" className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5">
                Start Triage Chat
              </a>
              <a href="/doctors" className="px-6 py-2.5 bg-white/80 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all shadow-sm">
                Find a Doctor
              </a>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
