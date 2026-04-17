const fs = require('fs');
const path = require('path');

// ── REVERT HOME.JSX ──
const homeFile = path.resolve(__dirname, 'Frontend/src/components/Home.jsx');
let homeSrc = fs.readFileSync(homeFile, 'utf8');

// 1. Remove UploadZone component definition
const uploadZoneStart = homeSrc.indexOf('function UploadZone(');
if (uploadZoneStart !== -1) {
  // Find where export default function Home starts
  const homeStart = homeSrc.indexOf('export default function Home', uploadZoneStart);
  homeSrc = homeSrc.substring(0, uploadZoneStart) + homeSrc.substring(homeStart);
}

// Remove react-dropzone import
homeSrc = homeSrc.replace("\nimport { useDropzone } from 'react-dropzone';", '');

// Replace RIGHT COLUMN with the Mock Video Feed (but containing light mode logic!)
const rightColumnStart = homeSrc.indexOf('{/* RIGHT COLUMN');
const rightColumnEnd = homeSrc.indexOf('{/* ── FEATURE CARDS GRID ── */}');
if (rightColumnStart !== -1 && rightColumnEnd !== -1) {
  const restoredRightColumn = `
            {/* RIGHT COLUMN: Live AI Mock Dashboard */}
            <div className="w-full max-w-md mx-auto lg:ml-auto hidden lg:flex flex-col animate-title-reveal delay-300">
              <div className="scan-hud-card bg-white/80 dark:bg-transparent p-6 w-full flex flex-col space-y-4 rounded-xl border border-gray-200 dark:border-white/10">
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="text-cyan-600 dark:text-cyan-400 w-5 h-5" />
                    <span className="text-gray-900 dark:text-white font-mono text-sm tracking-widest uppercase">AI Damage Detection &mdash; Live</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                </div>
                
                <div className="relative w-full aspect-[4/3] bg-gray-100 dark:bg-[#050d1a] rounded-lg border border-gray-200 dark:border-white/5 overflow-hidden flex items-center justify-center">
                   <div className="text-gray-500 dark:text-white/20 font-mono text-xs text-center z-0">WAITING FOR<br/>VIDEO FEED...</div>
                   {/* The Scanner Line */}
                   <div className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_#00f5ff] animate-scan-line z-10" />
                   {/* Wireframe Car Mock */}
                   <svg viewBox="0 0 100 50" className="absolute inset-4 opacity-30 stroke-cyan-600 dark:stroke-cyan-500 fill-none z-0" style={{ strokeWidth: '0.5' }}>
                     <path d="M20,40 L10,35 L15,20 L35,15 L70,15 L90,25 L95,40 Z" />
                     <circle cx="25" cy="40" r="5" />
                     <circle cx="80" cy="40" r="5" />
                     <path d="M35,15 L45,5 L65,5 L70,15" />
                   </svg>
                </div>
                
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-mono text-cyan-600 dark:text-cyan-300">
                      <span>FRAME_ANALYSIS</span>
                      <span>95%</span>
                    </div>
                    <div className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full transition-all duration-1000" style={{ width: '95%' }} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-mono text-emerald-600 dark:text-emerald-300">
                      <span>CONFIDENCE</span>
                      <span>98%</span>
                    </div>
                    <div className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: '98%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

`;
  homeSrc = homeSrc.substring(0, rightColumnStart) + restoredRightColumn + homeSrc.substring(rightColumnEnd);
}

fs.writeFileSync(homeFile, homeSrc, 'utf8');

// ── REVERT AIANALYSIS.JSX ──
const aiFile = path.resolve(__dirname, 'Frontend/src/components/AiAnalysis.jsx');
let aiSrc = fs.readFileSync(aiFile, 'utf8');

// 1. Remove map imports
const mapImportStart = aiSrc.indexOf("import { MapContainer");
if (mapImportStart !== -1) {
  const mapImportEnd = aiSrc.indexOf("function LocationMarker", mapImportStart);
  const mapFuncEnd = aiSrc.indexOf("}\n", mapImportEnd) + 2;
  if (mapFuncEnd > mapImportEnd) {
     aiSrc = aiSrc.substring(0, mapImportStart) + aiSrc.substring(mapFuncEnd);
  }
}

// 2. Remove location state hook and map effect hook
const effectStart = aiSrc.indexOf("const location = useLocation();");
if (effectStart !== -1) {
  const effectEnd = aiSrc.indexOf("const onDrop = useCallback");
  aiSrc = aiSrc.substring(0, Math.max(0, effectStart - 5)) + aiSrc.substring(effectEnd);
}

// 3. Remove userLocation state
aiSrc = aiSrc.replace(
  /\s*const \[userLocation, setUserLocation\] = useState.*\n.*navigator\.geolocation\.getCurrentPosition.*\n/g,
  '\n'
);

// 4. Remove useLocation import
aiSrc = aiSrc.replace(/import \{ useLocation \} from 'react-router-dom';\n/g, '');

// 5. Remove the huge injected UI section
const stitchDashStart = aiSrc.indexOf("{/* ── 3 STITCH DASHBOARD CARDS ── */}");
if (stitchDashStart !== -1) {
  const stitchDashEnd = aiSrc.indexOf("</div>\n          </div>\n", stitchDashStart);
  if (stitchDashEnd !== -1) {
    aiSrc = aiSrc.substring(0, stitchDashStart) + aiSrc.substring(stitchDashEnd + 26);
  }
}

fs.writeFileSync(aiFile, aiSrc, 'utf8');
console.log("Reversion script done.");
