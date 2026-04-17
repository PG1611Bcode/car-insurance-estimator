const fs = require('fs');
const path = require('path');

const aiFile = path.resolve(__dirname, 'Frontend/src/components/AiAnalysis.jsx');
let content = fs.readFileSync(aiFile, 'utf8');

// 1. WE NEED TO INJECT THE LOCATION EFFECT TO AUTO-TRIGGER
const locationEffect = `
  const location = useLocation();
  useEffect(() => {
    if (location.state?.imagePreview && status === 'idle' && !file) {
      setPreview(location.state.imagePreview);
      fetch(location.state.imagePreview)
        .then(res => res.blob())
        .then(blob => {
           const f = new File([blob], "uploaded_image.png", { type: blob.type });
           setFile(f);
        });
    }
  }, [location.state, status, file]);

  // Automatically handle analysis if file is set from location state
  useEffect(() => {
     if (location.state?.imagePreview && file && status === 'idle') {
        handleAnalyze();
        // Clear location state so we don't re-trigger on refresh if they cancel context
        window.history.replaceState({}, document.title);
     }
  }, [file, status]);

`;

// Insert this right inside `export default function AiAnalysis`.
const aiFuncStart = content.indexOf('export default function AiAnalysis() {');
if (aiFuncStart !== -1) {
  let hookInsert = content.indexOf('const [results, setResults]', aiFuncStart);
  const afterHooks = content.indexOf('const onDrop = useCallback(', hookInsert);
  content = content.substring(0, afterHooks) + locationEffect + content.substring(afterHooks);
}

// 2. INJECT LEAFLET AND MAP LOGIC AT THE TOP
const mapImports = `
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const CAR_REPAIR_GARAGES = [
  { name: 'Elite Auto Center', latOffset: 0.01, lngOffset: 0.015, rating: '4.8', wait: '2 days' },
  { name: 'Precision Bodyworks', latOffset: -0.012, lngOffset: 0.008, rating: '4.9', wait: 'Available Now' },
  { name: 'Metro Collision Repair', latOffset: -0.005, lngOffset: -0.02, rating: '4.6', wait: '1 week' }
];

function LocationMarker({ location, garages }) {
  const map = useMap();
  useEffect(() => { if (location) map.setView([location.lat, location.lng], 12); }, [location, map]);
  return location === null ? null : (
    <>
      <Marker position={[location.lat, location.lng]}><Popup>Your Location</Popup></Marker>
      {garages.map((g, i) => (
        <Marker key={i} position={[location.lat + g.latOffset, location.lng + g.lngOffset]}>
          <Popup><strong>{g.name}</strong><br/>⭐ {g.rating}<br/>Wait: {g.wait}</Popup>
        </Marker>
      ))}
    </>
  );
}
`;
content = content.replace(
  "import { Trophy, Settings, Crosshair, Zap, Layers, AlertCircle, FileText, Share2, Printer, Activity, CheckCircle, Target, Image as ImageIcon, MapPin, Search } from 'lucide-react';",
  "import { Trophy, Settings, Crosshair, Zap, Layers, AlertCircle, FileText, Share2, Printer, Activity, CheckCircle, Target, Image as ImageIcon, MapPin, Search, ShieldAlert, DollarSign, Navigation } from 'lucide-react';"
);
content = "import { useLocation } from 'react-router-dom';\n" + mapImports + content;

// We need to add `userLocation` state for the map
content = content.replace(
  "const [results, setResults]   = useState(null);",
  "const [results, setResults]   = useState(null);\n  const [userLocation, setUserLocation] = useState({ lat: 40.7128, lng: -74.0060 });\n  useEffect(() => { if(navigator.geolocation) { navigator.geolocation.getCurrentPosition(p => setUserLocation({lat: p.coords.latitude, lng: p.coords.longitude}))} }, []);\n"
);

// 3. RENDER THE 3 CARDS AND LEAFLET MAP ABOVE THE PDF GENERATOR
const cardsUI = `
          {/* ── 3 STITCH DASHBOARD CARDS ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 mb-6">
             <div className="bg-gradient-to-b from-white to-gray-50 dark:from-[#111827] dark:to-[#0A0F1E] border border-gray-200 dark:border-cyan-500/30 rounded-2xl p-6 flex flex-col relative overflow-hidden shadow-lg group hover:border-cyan-500 transition-all">
               <div className="flex items-center gap-2 mb-4">
                 <ShieldAlert className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                 <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400 font-bold">Classification</span>
               </div>
               <p className="text-2xl font-black text-gray-900 dark:text-white">{resnetClass}</p>
               <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl" />
             </div>
             <div className="bg-gradient-to-b from-white to-gray-50 dark:from-[#111827] dark:to-[#0A0F1E] border border-gray-200 dark:border-cyan-500/30 rounded-2xl p-6 flex flex-col relative overflow-hidden shadow-lg group hover:border-cyan-500 transition-all">
               <div className="flex items-center gap-2 mb-4">
                 <ImageIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                 <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400 font-bold">Impact Zone</span>
               </div>
               <p className="text-2xl font-black text-gray-900 dark:text-white">{results?.impactZone || resnetClass.split(' ')[0]}</p>
               <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
             </div>
             <div className="bg-gradient-to-b from-white to-gray-50 dark:from-[#111827] dark:to-[#0A0F1E] border border-cyan-300 dark:border-cyan-500/50 box-shadow-[0_0_20px_rgba(0,201,177,0.2)] rounded-2xl p-6 flex flex-col relative overflow-hidden shadow-lg">
               <div className="flex items-center gap-2 mb-4">
                 <DollarSign className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
                 <span className="text-xs uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-bold">Est. Repair Cost</span>
               </div>
               <p className="text-4xl font-black text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_15px_rgba(0,201,177,0.5)] animate-pulse">
                 {formatINR(results?.costEstimate || (costInfo.min + costInfo.max) / 2)}
               </p>
               <div className="absolute top-0 right-0 p-4">
                 <CheckCircle className="w-8 h-8 text-cyan-500/20" />
               </div>
             </div>
          </div>

          {/* ── GARAGE LOCATOR ── */}
          <div className="w-full mb-8">
             <div className="mb-4">
               <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                 <Navigation className="w-6 h-6 text-cyan-500" /> Partner Garages
               </h3>
             </div>
             <div className="w-full h-[400px] rounded-3xl overflow-hidden border border-gray-200 dark:border-cyan-500/20 shadow-2xl z-0 relative">
               <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={12} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                 <TileLayer
                   attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                   url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                 />
                 <LocationMarker location={userLocation} garages={CAR_REPAIR_GARAGES} />
               </MapContainer>
             </div>
          </div>
`;

// Find "Unified Summary" and put these right under it.
const summaryEndIdx = content.indexOf('</motion.div>', content.indexOf('AI Unified Summary')) + 13;
content = content.substring(0, summaryEndIdx) + cardsUI + content.substring(summaryEndIdx);

fs.writeFileSync(aiFile, content, 'utf8');
console.log('AiAnalysis patched successfully');
