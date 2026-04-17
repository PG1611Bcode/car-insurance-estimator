const fs = require('fs');
const path = require('path');

const homeFile = path.resolve(__dirname, 'Frontend/src/components/Home.jsx');
let content = fs.readFileSync(homeFile, 'utf8');

const heroStart = content.indexOf('{/* ── HERO SECTION ── */}');
const featureStart = content.indexOf('{/* ── FEATURE CARDS GRID ── */}');

const newHero = `{/* ── HERO SECTION ── */}
        <div className="relative w-full rounded-b-3xl overflow-hidden shadow-2xl flex flex-col justify-center min-h-[100vh] lg:min-h-screen"
             style={{ margin: '-32px -16px 0 -16px', width: 'calc(100% + 32px)' }}>
          {/* CSS Animated Background */}
          <div className="hero-css-bg">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent w-[200%] animate-gradient-sweep" />
            <div className="hero-grid" />
            {/* Floating Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[100px] animate-pulse-slow" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
            {/* Particle dots */}
            <div className="absolute left-[10%] bottom-0 w-[3px] h-[3px] bg-cyan-400/50 rounded-full animate-float-up delay-100" />
            <div className="absolute left-[30%] bottom-0 w-[4px] h-[4px] bg-cyan-400/40 rounded-full animate-float-up delay-300" />
            <div className="absolute left-[50%] bottom-0 w-[2px] h-[2px] bg-cyan-400/60 rounded-full animate-float-up delay-200" />
            <div className="absolute left-[70%] bottom-0 w-[5px] h-[5px] bg-cyan-400/30 rounded-full animate-float-up delay-400" />
            <div className="absolute left-[90%] bottom-0 w-[3px] h-[3px] bg-cyan-400/50 rounded-full animate-float-up" />
          </div>
          
          {/* 2 Column Layout */}
          <div className="relative z-10 px-6 lg:px-16 py-20 flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:gap-8 h-full w-full max-w-7xl mx-auto items-center mt-12">
            
            {/* LEFT COLUMN: Text Content */}
            <div className="flex flex-col space-y-6 lg:space-y-8 w-full">
              <div className="flex flex-col space-y-2">
                <h1 className="text-5xl md:text-6xl lg:text-[5rem] font-black tracking-tight leading-[1.1] text-white">
                  <span className="block animate-title-reveal">Smart Claims.</span>
                  <span className="block animate-title-reveal delay-200 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">
                    Instant Estimates.
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-slate-300 max-w-lg font-medium animate-title-reveal delay-300">
                  AI-powered vehicle damage detection and insurance claim automation.
                </p>
              </div>

              <div className="flex flex-col gap-6 w-full animate-title-reveal delay-400 mt-4">
                <div className="flex flex-row flex-wrap items-center gap-4">
                  {user && (
                    <div className="p-3 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-white/10 flex items-center gap-4 shrink-0 transition-all hover:bg-slate-800/80">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Coverage</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                          <span className="text-sm font-semibold text-white">Active</span>
                        </div>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Policy</span>
                        <span className="text-sm font-semibold text-cyan-400 font-mono">#{user.policyNumber}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleReportIncident}
                    className="shrink-0 relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-[#050d1a] font-bold tracking-wide transition-all overflow-hidden flex items-center gap-2 shadow-[0_0_20px_rgba(0,245,255,0.3)]"
                    style={{
                      clipPath: 'polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px)',
                    }}
                  >
                    {!user && <Lock className="w-4 h-4 text-[#050d1a]/70" />}
                    <Camera className="w-5 h-5" />
                    Report Incident
                  </button>
                </div>

                <button
                  onClick={() => navigate('/architecture')}
                  className="w-fit px-6 py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-semibold flex items-center gap-2 transition-all backdrop-blur-md"
                >
                  <PlayCircle className="w-5 h-5" />
                  Learn How It Works
                </button>

                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/10">
                  <span className="stat-badge">97% AI Accuracy</span>
                  <span className="stat-badge">&lt; 30s Assessment</span>
                  <span className="stat-badge">ResNet-50 + YOLO</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Live AI Mock Dashboard */}
            <div className="w-full max-w-md mx-auto lg:ml-auto hidden lg:flex flex-col animate-title-reveal delay-300">
              <div className="scan-hud-card p-6 w-full flex flex-col space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="text-cyan-400 w-5 h-5" />
                    <span className="text-white font-mono text-sm tracking-widest uppercase">AI Damage Detection &mdash; Live</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                </div>
                
                <div className="relative w-full aspect-[4/3] bg-[#050d1a] rounded-lg border border-white/5 overflow-hidden flex items-center justify-center">
                   <div className="text-white/20 font-mono text-xs text-center z-0">WAITING FOR<br/>VIDEO FEED...</div>
                   {/* The Scanner Line */}
                   <div className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_#00f5ff] animate-scan-line z-10" />
                   {/* Wireframe Car Mock */}
                   <svg viewBox="0 0 100 50" className="absolute inset-4 opacity-30 stroke-cyan-500 fill-none z-0" style={{ strokeWidth: '0.5' }}>
                     <path d="M20,40 L10,35 L15,20 L35,15 L70,15 L90,25 L95,40 Z" />
                     <circle cx="25" cy="40" r="5" />
                     <circle cx="80" cy="40" r="5" />
                     <path d="M35,15 L45,5 L65,5 L70,15" />
                   </svg>
                </div>
                
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-mono text-cyan-300">
                      <span>FRAME_ANALYSIS</span>
                      <span>95%</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full transition-all duration-1000" style={{ width: '95%' }} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-mono text-emerald-300">
                      <span>CONFIDENCE</span>
                      <span>98%</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: '98%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        `;

content = content.substring(0, heroStart) + newHero + content.substring(featureStart);
fs.writeFileSync(homeFile, content, 'utf8');
console.log('Home.jsx hero patched!');
