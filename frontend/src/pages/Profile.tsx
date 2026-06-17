import SidebarLayout from '../components/SidebarLayout';
import { useAuthStore } from '../store/authStore';
import PatientProfile from '../components/PatientProfile';
import DoctorProfile from '../components/DoctorProfile';

export default function Profile() {
  const { role } = useAuthStore();

  return (
    <SidebarLayout>
      {role === 'patient' && <PatientProfile />}
      {role === 'doctor' && <DoctorProfile />}
      {role === 'admin' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Admin Profile</h2>
          <p className="text-slate-600">Admin profile settings coming soon.</p>
        </div>
      )}
    </SidebarLayout>
  );
}
