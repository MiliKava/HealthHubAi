import SidebarLayout from '../components/SidebarLayout';
import { motion } from 'framer-motion';
import { Clock, FileText, ChevronRight } from 'lucide-react';

export default function HistoryPage() {
  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-amber-100 rounded-2xl">
              <Clock className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Session History</h1>
              <p className="text-slate-500 text-sm mt-0.5">Review all your past triage conversations</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 border-2 border-amber-100">
                <FileText className="w-9 h-9 text-amber-400" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800 mb-2">No Sessions Yet</h2>
              <p className="text-slate-400 text-sm max-w-sm">
                Your past triage sessions will appear here. Start a new session to get AI-powered health insights.
              </p>
              <motion.a href="/triage" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="mt-6 flex items-center gap-2 px-6 py-3 bg-brand-teal text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-teal/25 hover:bg-brand-teal-dark transition-all">
                Start a Triage <ChevronRight className="w-4 h-4" />
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
