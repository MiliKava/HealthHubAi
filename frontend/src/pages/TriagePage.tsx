import SidebarLayout from '../components/SidebarLayout';
import { motion } from 'framer-motion';
import { Stethoscope, Sparkles, Send } from 'lucide-react';
import { useState } from 'react';

export default function TriagePage() {
  const [message, setMessage] = useState('');

  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-brand-teal/10 rounded-2xl">
              <Stethoscope className="w-7 h-7 text-brand-teal" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Triage Chat</h1>
              <p className="text-slate-500 text-sm mt-0.5">Describe your symptoms and our AI will help assess them</p>
            </div>
          </div>

          {/* Chat area */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col" style={{ height: '60vh' }}>
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-brand-teal/10 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-9 h-9 text-brand-teal" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800 mb-2">Ready to Help</h2>
              <p className="text-slate-400 text-sm max-w-sm">
                Tell me about your symptoms. I'll ask follow-up questions to better understand your condition.
              </p>
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                {['I have a headache', 'Feeling feverish', 'Chest pain', 'Difficulty breathing'].map(s => (
                  <button key={s} onClick={() => setMessage(s)}
                    className="px-4 py-2 bg-slate-100 hover:bg-brand-teal/10 hover:text-brand-teal text-slate-600 rounded-full text-xs font-semibold transition-all border border-slate-200 hover:border-brand-teal/30">
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 p-4 bg-slate-50/50">
              <div className="flex gap-3 items-end">
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe your symptoms..."
                  rows={2}
                  className="flex-1 resize-none px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-700 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all font-medium"
                />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="p-3.5 bg-brand-teal hover:bg-brand-teal-dark text-white rounded-2xl shadow-lg shadow-brand-teal/30 transition-all shrink-0">
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
