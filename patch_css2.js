const fs = require('fs');
const path = require('path');

const cssFile = path.resolve(__dirname, 'Frontend/src/index.css');
let cssContent = fs.readFileSync(cssFile, 'utf8');

const newCSS = `
/* ── Dashboard Base Theme Elements ────────────── */
@layer components {
  .hero-css-bg {
    @apply absolute inset-0 bg-[#050d1a] overflow-hidden -z-10;
  }
  
  .hero-grid {
    @apply absolute inset-0;
    background-image: linear-gradient(rgba(0, 245, 255, 0.05) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0, 245, 255, 0.05) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .stat-badge {
    @apply inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border border-cyan-500/30 bg-cyan-900/20 text-cyan-400;
  }

  .scan-hud-card {
    @apply relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#0a1628]/80 backdrop-blur-xl;
    box-shadow: 0 0 30px rgba(0, 245, 255, 0.15);
  }
}

@layer utilities {
  .animate-title-reveal {
    opacity: 0;
    transform: translateY(20px);
    animation: revealUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  
  .delay-100 { animation-delay: 100ms; }
  .delay-200 { animation-delay: 200ms; }
  .delay-300 { animation-delay: 300ms; }
  .delay-400 { animation-delay: 400ms; }
}

@media (prefers-reduced-motion: no-preference) {
  .animate-gradient-sweep {
    animation: sweep 4s linear infinite;
  }
  
  .animate-pulse-slow {
    animation: pulseSlow 6s ease-in-out infinite alternate;
  }

  .animate-scan-line {
    animation: scanLine 2s linear infinite;
  }

  .animate-float-up {
    animation: floatUp 10s linear infinite;
  }
}

@keyframes sweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes pulseSlow {
  0% { opacity: 0.3; transform: scale(0.8); }
  100% { opacity: 0.6; transform: scale(1.1); }
}

@keyframes scanLine {
  0% { top: 0; opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

@keyframes floatUp {
  0% { transform: translateY(100vh) scale(0); opacity: 0; }
  10% { opacity: 0.2; transform: scale(1); }
  90% { opacity: 0.2; }
  100% { transform: translateY(-100px) scale(0.5); opacity: 0; }
}

@keyframes revealUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

if (!cssContent.includes('hero-grid')) {
  fs.appendFileSync(cssFile, newCSS, 'utf8');
  console.log('Appended hero CSS to src/index.css');
} else {
  console.log('Already patched');
}
