import { useAuthStore } from '../store/authStore';

export default function UserRoleBadge() {
  const { user } = useAuthStore();

  if (!user) return null;

  let displayName = '';
  if (user.role === 'doctor') {
    displayName = `Dr. ${user.full_name || 'Doctor'}`;
  } else if (user.role === 'patient') {
    displayName = `Pt. ${user.full_name || 'Patient'}`;
  } else if (user.role === 'admin') {
    displayName = 'Admin';
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] bg-white border border-slate-200 px-4 py-2 rounded-full shadow-md text-sm font-semibold text-slate-700 flex items-center gap-2" data-element-id="user-role-badge">
      <div className={`w-2 h-2 rounded-full ${
        user.role === 'doctor' ? 'bg-red-500' : 
        user.role === 'patient' ? 'bg-emerald-500' : 
        'bg-purple-500'
      }`}></div>
      {displayName}
    </div>
  );
}
