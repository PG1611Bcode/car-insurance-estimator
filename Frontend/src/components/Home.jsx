import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ArrowRight, LogIn, Zap, Lock, X, PlayCircle, ShieldCheck, MapPin, Search, FileText, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── Auth Gate Modal ─────────────────────────────────────────────────────────
function AuthGateModal({ onClose, onSignIn }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: 'rgba(3,7,18,0.80)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="glass-card w-full max-w-sm p-6 space-y-5 relative bg-white/90 dark:bg-slate-900/80 border border-gray-200 dark:border-cyan-500/20 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 dark:text-white/30 hover:text-gray-900 dark:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center gap-4 pt-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl blur-2xl opacity-40"
              style={{ background: 'radial-gradient(circle, #00f5ff 0%, transparent 70%)' }} />
            <div className="relative bg-white/[0.05] border border-cyan-500/20 p-4 rounded-2xl">
              <Lock className="w-8 h-8 text-cyan-500 dark:text-cyan-400" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-1">Sign In Required</h3>
            <p className="text-gray-600 dark:text-white/40 text-sm">
              Please sign in to report an incident and access AI damage analysis.
            </p>
          </div>
        </div>

        <button
          onClick={onSignIn}
          className="btn-premium w-full py-3.5 flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          <span className="font-bold text-white">Sign In</span>
        </button>
        <button onClick={onClose} className="w-full text-sm text-gray-400 dark:text-white/25 hover:text-gray-600 dark:text-white/50 transition-colors">
          Maybe later
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthGate, setShowAuthGate] = useState(false);

  const handleReportIncident = () => {
    if (!user) {
      setShowAuthGate(true);
    } else {
      navigate('/analysis');
    }
  };

  return (
    <>
      <AnimatePresence>
        {showAuthGate && (
          <AuthGateModal
            onClose={() => setShowAuthGate(false)}
            onSignIn={() => { setShowAuthGate(false); navigate('/login'); }}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-8 pb-6 lg:pb-12 pt-0 w-full overflow-hidden">
        
        {/* ── HERO SECTION ── */}
        <div className="relative w-full rounded-b-3xl overflow-hidden shadow-2xl flex flex-col justify-center min-h-[100vh] lg:min-h-screen"
             style={{ margin: '-32px -16px 0 -16px', width: 'calc(100% + 32px)' }}>
          {/* CSS Animated Background */}
          <div className="hero-css-bg">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent w-[200%] animate-gradient-sweep" />
            <div className="hero-grid opacity-20 dark:opacity-100" />
            {/* Floating Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[100px] animate-pulse-slow" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
          </div>
          
          <div className="relative z-10 px-6 lg:px-16 py-20 flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:gap-8 h-full w-full max-w-7xl mx-auto items-center mt-12">
            
            {/* LEFT COLUMN: Text Content */}
            <div className="flex flex-col space-y-6 lg:space-y-8 w-full">
              <div className="flex flex-col space-y-2">
                <h1 className="text-5xl md:text-6xl lg:text-[5rem] font-black tracking-tight leading-[1.1] text-gray-900 dark:text-white">
                  <span className="block animate-title-reveal">Smart Claims.</span>
                  <span className="block animate-title-reveal delay-200 text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-500 dark:from-cyan-400 dark:to-teal-400">
                    Instant Estimates.
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-gray-700 dark:text-slate-300 max-w-lg font-medium animate-title-reveal delay-300">
                  AI-powered vehicle damage detection and insurance claim automation.
                </p>
              </div>

              <div className="flex flex-col gap-6 w-full animate-title-reveal delay-400 mt-4">
                <div className="flex flex-row flex-wrap items-center gap-4">
                  {user && (
                    <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 flex items-center gap-4 shrink-0 transition-all hover:bg-gray-50 dark:hover:bg-slate-800/80 shadow-lg">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-white/50 font-bold">Coverage</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">Active</span>
                        </div>
                      </div>
                      <div className="h-8 w-px bg-gray-200 dark:bg-white/10" />
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-white/50 font-bold">Policy</span>
                        <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 font-mono">#{user.policyNumber}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleReportIncident}
                    className="shrink-0 relative px-8 py-4 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white font-bold tracking-wide transition-all overflow-hidden flex items-center gap-2 shadow-xl"
                    style={{
                      clipPath: 'polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px)',
                    }}
                  >
                    {!user && <Lock className="w-4 h-4 text-white/70" />}
                    <Camera className="w-5 h-5" />
                    Report Incident
                  </button>
                </div>

                <button
                  onClick={() => navigate('/architecture')}
                  className="w-fit px-6 py-3 rounded-xl border border-cyan-200 dark:border-cyan-500/30 bg-white dark:bg-cyan-500/10 hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-semibold flex items-center gap-2 transition-all backdrop-blur-md shadow-md"
                >
                  <PlayCircle className="w-5 h-5" />
                  Learn How It Works
                </button>

                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                  <span className="stat-badge bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 px-3 py-1 rounded-full text-xs font-bold font-mono">97% AI Accuracy</span>
                  <span className="stat-badge bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 px-3 py-1 rounded-full text-xs font-bold font-mono">&lt; 30s Assessment</span>
                  <span className="stat-badge bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 px-3 py-1 rounded-full text-xs font-bold font-mono">ResNet-50 + YOLO</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Live AI Mock Dashboard */}
            <div className="w-full max-w-md mx-auto lg:ml-auto hidden lg:flex flex-col animate-title-reveal delay-300">
              <div className="scan-hud-card bg-white/90 dark:bg-[#030712]/40 backdrop-blur-xl p-6 w-full flex flex-col space-y-4 rounded-3xl border border-gray-200 dark:border-cyan-500/20 shadow-2xl">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="text-cyan-600 dark:text-cyan-400 w-5 h-5" />
                    <span className="text-gray-900 dark:text-white font-mono text-sm tracking-widest uppercase">Live AI Diagnostics</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]" />
                </div>
                
                <div className="relative w-full aspect-[4/3] bg-gray-100 dark:bg-slate-900/60 rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden flex items-center justify-center">
                   <div className="text-gray-400 dark:text-white/20 font-mono text-[10px] text-center z-0 tracking-tighter">WAITING FOR<br/>REMOTE UPLOAD</div>
                   <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none" />
                   {/* The Scanner Line */}
                   <div className="absolute left-0 right-0 h-1 bg-cyan-500/50 shadow-[0_0_15px_#06b6d4] animate-scan-line z-10" />
                   {/* Wireframe Car Mock */}
                   <svg viewBox="0 0 100 50" className="absolute inset-4 opacity-20 dark:opacity-30 stroke-gray-900 dark:stroke-cyan-500 fill-none z-0" style={{ strokeWidth: '0.5' }}>
                     <path d="M20,40 L10,35 L15,20 L35,15 L70,15 L90,25 L95,40 Z" />
                     <circle cx="25" cy="40" r="5" />
                     <circle cx="80" cy="40" r="5" />
                     <path d="M35,15 L45,5 L65,5 L70,15" />
                   </svg>
                </div>
                
                <div className="flex flex-col gap-4 pt-2">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-cyan-700 dark:text-cyan-400 font-bold uppercase tracking-widest">
                      <span>Neural Process</span>
                      <span>95%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full transition-all duration-1000" style={{ width: '95%' }} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-widest">
                      <span>Model Confidence</span>
                      <span>98%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: '98%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── FEATURE CARDS GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          {[
            {
              title: 'AI Damage Scan',
              description: 'ResNet-50 plus YOLO dual model detection for precise damage evaluation.',
              icon: Search,
              color: 'text-cyan-600 dark:text-cyan-400',
              bg: 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-100 dark:border-cyan-500/20'
            },
            {
              title: 'Claim Predictor',
              description: 'ML-powered instant repair cost estimate converted to \u20B9 (Indian Rupees).',
              icon: Zap,
              color: 'text-emerald-600 dark:text-emerald-400',
              bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
            },
            {
              title: 'Garage Finder',
              description: 'Interactive map identifying verified network repair shops near you.',
              icon: MapPin,
              color: 'text-indigo-600 dark:text-indigo-400',
              bg: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20'
            },
            {
              title: 'PDF Reports',
              description: 'Downloadable official claim documents for records and verification.',
              icon: FileText,
              color: 'text-orange-600 dark:text-orange-400',
              bg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20'
            }
          ].map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * idx }}
              className="glass-card bg-white/70 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] p-6 flex gap-4 items-start group hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-xl"
            >
              <div className={`p-3 rounded-xl border ${feature.bg} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sign-in link for guests */}
        {!user && (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            onClick={() => navigate('/login')}
            className="mt-4 mx-auto flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign in to view your policy details and history
          </motion.button>
        )}
      </div>
    </>
  );
}
