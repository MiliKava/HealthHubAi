import { useAuthStore } from '../store/authStore';
import SidebarLayout from '../components/SidebarLayout';

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
            We're sorry, but your application to join CareBridge AI as a doctor has been rejected. You cannot access the doctor dashboard.
          </p>
        </div>
      </div>
    );
  }

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

        <h2 className="text-2xl font-bold text-slate-900 mb-6">Welcome to your Dashboard, {user?.full_name}</h2>
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-600 mb-4">
            This is a placeholder for the Phase 2 dashboard. Based on your role ({role}), you'll see specific features here in future phases.
          </p>
          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 mb-2">Debug Info:</h3>
            <pre className="text-xs text-slate-500 overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
