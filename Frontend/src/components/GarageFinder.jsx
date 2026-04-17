import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { Navigation2, MapPin, Phone, Star, ExternalLink, Search, Filter, X } from 'lucide-react';

// Fix Leaflet's default icon path issues
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl, iconRetinaUrl, shadowUrl,
  iconSize: [25, 41], iconAnchor: [12, 41],
  popupAnchor: [1, -34], shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const UserIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41],
  popupAnchor: [1, -34], shadowSize: [41, 41]
});

const GarageIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41],
  popupAnchor: [1, -34], shadowSize: [41, 41]
});

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center[0] !== 0) map.setView(center, 13);
  }, [center, map]);
  return null;
}

// Rating color helper
function ratingColor(r) {
  if (r >= 4.7) return '#00ff88';
  if (r >= 4.3) return '#fbbf24';
  return '#f97316';
}

export default function GarageFinder() {
  const [location, setLocation] = useState([37.7749, -122.4194]);
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation([lat, lng]);

          const offset = 0.03;
          setGarages([
            {
              id: 1, name: 'AutoFix Premium',
              rating: 4.8, distance: '1.2 km',
              phone: '+91-98100-44521', specialty: 'Authorized · Multi-brand',
              lat: lat + (Math.random() * offset - offset / 2),
              lng: lng + (Math.random() * offset - offset / 2),
            },
            {
              id: 2, name: 'City Center Garage',
              rating: 4.5, distance: '2.4 km',
              phone: '+91-98765-32109', specialty: 'Body Work · Paint',
              lat: lat + (Math.random() * offset - offset / 2),
              lng: lng + (Math.random() * offset - offset / 2),
            },
            {
              id: 3, name: 'Express Repair Hub',
              rating: 4.9, distance: '3.7 km',
              phone: '+91-91234-78056', specialty: 'Express · Insurance Partner',
              lat: lat + (Math.random() * offset - offset / 2),
              lng: lng + (Math.random() * offset - offset / 2),
            },
            {
              id: 4, name: 'Metro Auto Works',
              rating: 4.3, distance: '4.1 km',
              phone: '+91-99887-65432', specialty: 'Engine · Diagnostics',
              lat: lat + (Math.random() * offset - offset / 2),
              lng: lng + (Math.random() * offset - offset / 2),
            },
          ]);
          setLoading(false);
        },
        () => setLoading(false)
      );
    } else {
      setLoading(false);
    }
  }, []);

  const openGoogleMaps = (lat, lng) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      '_blank', 'noopener,noreferrer'
    );
  };

  const filtered = garages.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.specialty?.toLowerCase().includes(search.toLowerCase());
    const matchRating = g.rating >= minRating;
    return matchSearch && matchRating;
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-3 pt-4 lg:pt-6 pb-6"
    >

      {/* Header */}
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold text-white">Authorized Garages</h2>
        <p className="text-slate-400 text-sm">Find verified repair shops near your location</p>
      </div>

      {/* ── Search + Filter Bar ── */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search garages..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800/60 border border-white/[0.08] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/40 text-sm transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setFilterOpen(f => !f)}
          className={`px-3 rounded-xl border transition-all text-sm font-medium flex items-center gap-1.5 ${
            filterOpen || minRating > 0
              ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
              : 'border-white/[0.08] bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filter
        </button>
      </div>

      {/* Filter Panel */}
      {filterOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-3 flex items-center gap-3"
        >
          <span className="text-xs text-white/40 shrink-0">Min Rating</span>
          <input
            type="range" min="0" max="5" step="0.5"
            value={minRating}
            onChange={e => setMinRating(Number(e.target.value))}
            className="flex-1 h-1.5 appearance-none rounded-full cursor-pointer"
            style={{
              background: `linear-gradient(to right, #00f5ff ${(minRating / 5) * 100}%, rgba(255,255,255,0.08) ${(minRating / 5) * 100}%)`,
            }}
          />
          <span className="text-cyan-400 text-sm font-bold font-mono w-8 text-right">
            {minRating > 0 ? `${minRating}★` : 'Any'}
          </span>
        </motion.div>
      )}

      {/* ── Map — Large ── */}
      <div className="rounded-2xl overflow-hidden relative border border-white/[0.08]"
        style={{ height: '60vh', minHeight: 320, boxShadow: '0 0 40px rgba(0,0,0,0.4)' }}>
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            <p className="text-white/30 text-sm">Locating garages...</p>
          </div>
        ) : (
          <MapContainer center={location} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">Carto</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <ChangeView center={location} />

            <Marker position={location} icon={UserIcon}>
              <Popup>📍 You are here</Popup>
            </Marker>

            {filtered.map(g => (
              <Marker key={g.id} position={[g.lat, g.lng]} icon={GarageIcon}>
                <Popup>
                  <div style={{ minWidth: '170px' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px', color: '#1e293b' }}>
                      {g.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
                      ⭐ {g.rating} · {g.distance}
                    </div>
                    {g.specialty && (
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>{g.specialty}</div>
                    )}
                    <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px' }}>📞 {g.phone}</div>
                    <button
                      onClick={() => openGoogleMaps(g.lat, g.lng)}
                      style={{
                        width: '100%', padding: '6px 10px',
                        backgroundColor: '#0ea5e9', color: 'white',
                        border: 'none', borderRadius: '8px', cursor: 'pointer',
                        fontSize: '12px', fontWeight: '600',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                      }}
                    >
                      🗺️ Navigate Here
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Results badge overlay */}
        {!loading && (
          <div className="absolute top-3 left-3 z-[1000] bg-black/70 text-cyan-400 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-md border border-cyan-500/20">
            {filtered.length} garage{filtered.length !== 1 ? 's' : ''} found
          </div>
        )}
      </div>

      {/* ── Compact Garage Cards ── */}
      <div className="grid gap-2">
        {filtered.map((g, i) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-panel p-3 flex items-center justify-between group hover:bg-slate-800/50 hover:border-cyan-500/15 transition-all duration-200"
          >
            <div className="flex gap-3 items-center min-w-0">
              <div className="bg-cyan-500/10 border border-cyan-500/15 p-2 rounded-xl text-cyan-400 flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-white text-sm group-hover:text-cyan-400 transition-colors truncate">
                  {g.name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                    <Navigation2 className="w-2.5 h-2.5" /> {g.distance}
                  </span>
                  <span className="text-[10px] flex items-center gap-0.5 font-semibold" style={{ color: ratingColor(g.rating) }}>
                    <Star className="w-2.5 h-2.5 fill-current" /> {g.rating}
                  </span>
                  {g.specialty && (
                    <span className="text-[10px] text-slate-500 hidden sm:inline truncate max-w-[110px]">{g.specialty}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <a
                href={`tel:${g.phone.replace(/[^+\d]/g, '')}`}
                className="bg-slate-700/50 p-2 rounded-lg hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors text-slate-400"
                title="Call"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => openGoogleMaps(g.lat, g.lng)}
                className="bg-slate-700/50 p-2 rounded-lg hover:bg-emerald-600/30 hover:text-emerald-400 transition-colors text-slate-400"
                title="Navigate"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="text-center text-slate-500 py-6 text-sm flex flex-col items-center gap-2">
            <MapPin className="w-6 h-6 opacity-30" />
            {garages.length === 0
              ? 'Please enable location services to find nearby garages.'
              : 'No garages match your search.'}
          </div>
        )}
      </div>
    </motion.div>
  );
}
