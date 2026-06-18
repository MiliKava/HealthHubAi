import SidebarLayout from '../components/SidebarLayout';
import { motion } from 'framer-motion';
import { Calendar, Plus, CheckCircle } from 'lucide-react';

export default function AppointmentsPage() {
  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <Calendar className="w-7 h-7 text-rose-500" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Appointments</h1>
                <p className="text-slate-500 text-sm mt-0.5">Manage your upcoming and past appointments</p>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal text-white rounded-xl font-bold text-sm shadow-md shadow-brand-teal/25 hover:bg-brand-teal-dark transition-all">
              <Plus className="w-4 h-4" /> Book Appointment
            </motion.button>
          </div>

          {/* Upcoming */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 mb-5">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle className="w-5 h-5 text-brand-teal" />
              <h2 className="font-extrabold text-slate-800">Upcoming</h2>
            </div>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 border-2 border-rose-100">
                <Calendar className="w-7 h-7 text-rose-300" />
              </div>
              <p className="text-slate-500 font-semibold">No upcoming appointments</p>
              <p className="text-slate-400 text-sm mt-1">Book your first appointment with a specialist.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
