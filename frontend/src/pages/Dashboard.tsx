import { useAuthStore } from '../store/authStore';
import SidebarLayout from '../components/SidebarLayout';
import { motion } from 'framer-motion';
import { AlertCircle, XCircle, LayoutDashboard, User } from 'lucide-react';

export default function Dashboard() {
  const { user, role } = useAuthStore();

  const isPendingDoctor = role === 'doctor' && user?.doctor_profile?.approval_status === 'pending';
  const isRejectedDoctor = role === 'doctor' && user?.doctor_profile?.approval_status === 'rejected';

  if (isRejectedDoctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl opacity-50 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl opacity-50 animate-pulse-slow"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-card p-10 rounded-2xl max-w-md w-full text-center relative z-10 border-red-200 shadow-2xl shadow-red-500/10"
        >
          <div className="text-red-500 flex justify-center mb-6">
            <XCircle className="w-20 h-20 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Application Rejected</h2>
          <p className="text-slate-600 mb-6 text-lg">
            We're sorry, but your application to join HealthHub AI as a doctor has been rejected. You cannot access the doctor dashboard.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <SidebarLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto py-8"
      >
        {isPendingDoctor && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-amber-50/80 backdrop-blur-md border border-amber-200/50 p-6 rounded-2xl mb-8 flex gap-4 items-start shadow-lg shadow-amber-500/5"
          >
            <AlertCircle className="text-amber-500 w-6 h-6 flex-shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h3 className="text-amber-800 font-semibold text-lg mb-1">Application Under Review</h3>
              <p className="text-amber-700/80">
                Your profile is currently being reviewed by our medical board. You will gain full access to doctor features once approved.
              </p>
            </div>
          </motion.div>
        )}

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-health-blue/10 rounded-xl">
            <LayoutDashboard className="w-8 h-8 text-health-blue" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, <span className="text-gradient">{user?.full_name}</span>
            </h2>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <User className="w-4 h-4" />
              {role.charAt(0).toUpperCase() + role.slice(1)} Portal
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div whileHover={{ y: -5 }} className="glass-card p-6 rounded-2xl border-white/60">
            <h3 className="text-lg font-semibold mb-2">Upcoming Appointments</h3>
            <p className="text-3xl font-bold text-health-blue">0</p>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="glass-card p-6 rounded-2xl border-white/60">
            <h3 className="text-lg font-semibold mb-2">Unread Messages</h3>
            <p className="text-3xl font-bold text-health-green">0</p>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="glass-card p-6 rounded-2xl border-white/60">
            <h3 className="text-lg font-semibold mb-2">Health Score</h3>
            <p className="text-3xl font-bold text-gradient">N/A</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-8 rounded-2xl border-white/60"
        >
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold text-slate-800">System Diagnostic Info</h3>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Developer Mode</span>
          </div>
          <p className="text-slate-600 mb-6 text-lg">
            This is a placeholder for the Phase 2 dashboard. Based on your role (<strong className="text-health-blue">{role}</strong>), you'll see specific features here in future phases.
          </p>

          <div className="mt-6 p-6 bg-slate-900/5 backdrop-blur-sm rounded-xl border border-slate-200/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-health-green animate-pulse"></div>
              <h4 className="text-sm font-bold text-slate-700">Active User Session Data</h4>
            </div>
            <pre className="text-sm text-slate-600 overflow-auto bg-white/50 p-4 rounded-lg font-mono">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </motion.div>
      </motion.div>
    </SidebarLayout>
  );
}
