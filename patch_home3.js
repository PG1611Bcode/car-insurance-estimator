const fs = require('fs');
const path = require('path');

const homeFile = path.resolve(__dirname, 'Frontend/src/components/Home.jsx');
let content = fs.readFileSync(homeFile, 'utf8');

const startIdx = content.indexOf('{/* RIGHT COLUMN');
const endIdx = content.indexOf('{/* ── FEATURE CARDS GRID ── */}');

// We will replace the entire RIGHT COLUMN with the DROPZONE
// Also, we need to fix light mode on the LEFT COLUMN and FEATURE GRID
// Wait, the best way to do this is to replace chunks correctly.

let rightColumn = `
            {/* RIGHT COLUMN: Interactive Dropzone */}
            <div className="w-full max-w-md mx-auto lg:ml-auto flex flex-col animate-title-reveal delay-300">
              <div className="bg-white dark:bg-[#0a1628]/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-cyan-500/20 shadow-xl overflow-hidden">
                <UploadZone navigate={navigate} />
              </div>
            </div>

          </div>
        </div>

`;

// Add UploadZone to the file before export default function Home
const uploadZoneDef = `
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle } from 'lucide-react';

function UploadZone({ navigate }) {
  const [preview, setPreview] = useState(null);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      const selected = acceptedFiles[0];
      setPreview(URL.createObjectURL(selected));
    }
  });

  return (
    <div className="p-6 flex flex-col space-y-4">
      <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <UploadCloud className="text-cyan-600 dark:text-cyan-400 w-5 h-5" />
          <span className="text-gray-900 dark:text-white font-mono text-sm tracking-widest uppercase">Damage Assessment</span>
        </div>
      </div>
      
      <div 
        {...getRootProps()} 
        className={\`relative w-full aspect-[4/3] rounded-lg border-2 border-dashed overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all \${isDragActive ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' : 'border-gray-300 dark:border-white/20 hover:border-cyan-400 dark:hover:border-cyan-500/50'}\`}
      >
        <input {...getInputProps()} />
        {preview ? (
           <img src={preview} alt="Damage Preview" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
           <>
             <UploadCloud className="w-10 h-10 text-gray-400 dark:text-white/40 mb-3" />
             <div className="text-gray-600 dark:text-white/50 font-mono text-xs text-center">
               DRAG & DROP IMAGE<br/>OR CLICK TO BROWSE
             </div>
           </>
        )}
      </div>

      {preview && (
        <button
          onClick={() => navigate('/analysis', { state: { imagePreview: preview } })}
          className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 dark:from-cyan-500 dark:to-teal-400 dark:hover:from-cyan-400 dark:hover:to-teal-300 text-white dark:text-[#050d1a] font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-4"
        >
          <CheckCircle className="w-5 h-5" />
          Analyze Claim Now
        </button>
      )}
    </div>
  );
}

`;

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + rightColumn + content.substring(endIdx);
}

// We need to inject the component.
// But first, let's fix the file imports to remove UploadCloud being imported twice if not needed, we'll just require it.
content = content.replace(
  "import { Camera, ArrowRight, LogIn, Zap, Lock, X, PlayCircle, ShieldCheck, MapPin, Search, FileText, Activity } from 'lucide-react';",
  "import { Camera, ArrowRight, LogIn, Zap, Lock, X, PlayCircle, ShieldCheck, MapPin, Search, FileText, Activity, UploadCloud, CheckCircle } from 'lucide-react';\nimport { useDropzone } from 'react-dropzone';"
);

// Insert UploadZone definition right before "export default function Home"
content = content.replace("export default function Home", uploadZoneDef.replace(/import .*/g, '') + "export default function Home");

// Fix Light Mode in Left Column
content = content.replace(/text-slate-300/g, 'text-gray-700 dark:text-slate-300');
content = content.replace(/text-white\/50/g, 'text-gray-500 dark:text-white/50');
content = content.replace(/text-white/g, 'text-gray-900 dark:text-white');
content = content.replace(/bg-slate-900\/60/g, 'bg-white/80 dark:bg-slate-900/60');
content = content.replace(/hover:bg-slate-800\/80/g, 'hover:bg-gray-50 dark:hover:bg-slate-800/80');
content = content.replace(/border-white\/10/g, 'border-gray-200 dark:border-white/10');
content = content.replace(/bg-white\/5/g, 'bg-gray-100 dark:bg-white/5');
content = content.replace(/hover:bg-white\/10/g, 'hover:bg-gray-200 dark:hover:bg-white/10');

// Feature cards light mode fixes
content = content.replace(/bg-white\/\[0\.03\]/g, 'bg-white dark:bg-white/[0.03]');
content = content.replace(/border-white\/\[0\.06\]/g, 'border-gray-200 dark:border-white/[0.06]');
content = content.replace(/text-slate-400/g, 'text-gray-600 dark:text-slate-400');
content = content.replace(/bg-white\/\[0\.04\]/g, 'bg-gray-50 dark:bg-white/[0.04]');

fs.writeFileSync(homeFile, content, 'utf8');
console.log('Home.jsx patched properly');
