import { motion, useMotionValue, useTransform } from "framer-motion"
import { Button } from "../components/ui/button"
import { ShieldCheck, Activity, Stethoscope, Pill, Syringe, Thermometer } from "lucide-react"
import { Navbar } from "../components/layout/Navbar"
import { Footer } from "../components/layout/Footer"
import { Link } from "react-router-dom"
import React from "react"

export default function LandingPage() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-300, 300], [10, -10]);
  const rotateY = useTransform(x, [-300, 300], [-10, 10]);

  function handleMouse(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section 
          className="relative overflow-hidden py-16 md:py-24 bg-[#fffaf5] perspective-1000"
          onMouseMove={handleMouse}
          onMouseLeave={handleMouseLeave}
        >
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            
            {/* Left Image Side (Phone + Doctor + Floating elements) */}
            <div className="relative order-2 md:order-1 flex justify-center items-center h-[550px] perspective-[1000px]">
              
              {/* Floating Elements Background */}
              <motion.div 
                style={{ x: useTransform(x, [-300, 300], [30, -30]), y: useTransform(y, [-300, 300], [30, -30]) }}
                animate={{ rotate: [0, 10, 0] }} 
                transition={{ duration: 5, repeat: Infinity }} 
                className="absolute top-10 left-10 text-brand-teal opacity-80 drop-shadow-xl"
              >
                <Pill className="w-12 h-12" />
              </motion.div>
              <motion.div 
                style={{ x: useTransform(x, [-300, 300], [-40, 40]), y: useTransform(y, [-300, 300], [-40, 40]) }}
                animate={{ rotate: [0, -15, 0] }} 
                transition={{ duration: 6, repeat: Infinity }} 
                className="absolute bottom-20 left-4 text-rose-400 opacity-80 drop-shadow-xl"
              >
                <Syringe className="w-14 h-14" />
              </motion.div>
              <motion.div 
                style={{ x: useTransform(x, [-300, 300], [-20, 20]), y: useTransform(y, [-300, 300], [20, -20]) }}
                animate={{ rotate: [0, 20, 0] }} 
                transition={{ duration: 4, repeat: Infinity }} 
                className="absolute top-1/4 right-10 text-amber-400 opacity-80 drop-shadow-xl"
              >
                <Thermometer className="w-12 h-12" />
              </motion.div>
              
              {/* The Phone Outline - 3D Rotated */}
              <motion.div 
                style={{ rotateX, rotateY, z: 50 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative z-10 w-[280px] h-[560px] bg-brand-teal/10 rounded-[3rem] border-[12px] border-[#f8e5cc] shadow-2xl overflow-hidden flex flex-col transform-gpu"
              >
                <div className="bg-[#f8e5cc] h-6 w-full flex justify-center items-center">
                  <div className="w-16 h-2 bg-black/20 rounded-full"></div>
                </div>
                <div className="flex-1 bg-gradient-to-b from-brand-teal to-brand-teal-dark relative flex items-end justify-center pb-0">
                  <img 
                    src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400" 
                    alt="Doctor" 
                    className="w-[95%] h-[80%] object-cover object-top rounded-t-[2.5rem] border-4 border-white shadow-2xl relative z-20 transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute bottom-6 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl z-30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-xs font-bold text-slate-700">Dr. Sarah Online</span>
                    </div>
                    <div className="h-2 w-1/2 bg-slate-200 rounded mb-2"></div>
                    <div className="h-2 w-3/4 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Content Side */}
            <motion.div
              className="order-1 md:order-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight mb-4 tracking-tighter drop-shadow-sm">
                HealthHub <br/>
                <span className="font-light text-brand-teal text-4xl md:text-5xl tracking-normal">The Future of Care</span>
              </h1>
              <p className="text-lg text-slate-600 mb-2 font-semibold tracking-wide uppercase text-brand-teal-dark">
                Premium Healthcare Platform
              </p>
              <p className="text-xl text-slate-500 mb-10 max-w-lg leading-relaxed">
                Experience the future of healthcare with our AI-powered portal. Get personalized insights, virtual consultations, and manage your well-being directly from your smartphone.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/dashboard">
                  <Button className="rounded-full px-10 py-7 bg-brand-teal hover:bg-brand-teal-dark text-white font-bold text-base tracking-wide shadow-xl shadow-brand-teal/30 hover:-translate-y-1 transition-all">
                    TRY NOW
                  </Button>
                </Link>
                <Link to="#features">
                  <Button variant="outline" className="rounded-full px-10 py-7 border-2 border-brand-teal text-brand-teal hover:bg-brand-teal/5 font-bold text-base tracking-wide hover:-translate-y-1 transition-all">
                    SEE MORE
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Teal Features Band */}
        <section id="features" className="bg-gradient-to-r from-brand-teal-dark to-brand-teal py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid md:grid-cols-3 gap-12 text-white">
              {[
                { icon: Activity, title: "Real-time Monitoring", desc: "Track your vitals seamlessly with our connected health ecosystem without leaving your home." },
                { icon: Stethoscope, title: "Top Specialists", desc: "Connect with certified doctors from the best hospitals instantly for secure virtual visits." },
                { icon: ShieldCheck, title: "AI Diagnostics", desc: "Get early warning signs and personalized health insights powered by secure AI." }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, rotateX: -90, y: 50 }}
                  whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: i * 0.2, type: "spring", bounce: 0.4 }}
                  className="flex flex-col gap-5 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors shadow-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-xl shadow-inner">
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight">{feature.title}</h3>
                  </div>
                  <p className="text-brand-teal-light text-base leading-relaxed opacity-95">
                    {feature.desc}
                  </p>
                  <div className="flex gap-1.5 mt-auto pt-4">
                    <div className="w-2 h-2 rounded-full bg-white opacity-50"></div>
                    <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                    <div className="w-2 h-2 rounded-full bg-white opacity-50"></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
