import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Camera, MapPin, FileText, UserCircle, LogOut, Cpu, Home as HomeIcon, Sun, Moon } from 'lucide-react';
import Home from './components/Home';
import AiAnalysis from './components/AiAnalysis';
import GarageFinder from './components/GarageFinder';
import ManualClaim from './components/ManualClaim';
import Login from './components/Login';
import Register from './components/Register';
import ArchitectureDiagrams from './components/ArchitectureDiagrams';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  const navItems = [
    { path: '/',             icon: HomeIcon, label: 'Home'    },
    { path: '/analysis',     icon: Cpu,      label: 'Scan'    },
    { path: '/manual-claim', icon: FileText, label: 'Claim'   },
    { path: '/garage',       icon: MapPin,   label: 'Garages' },
  ];

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* ── Top Bar ── */}
      <header
        className="fixed top-0 w-full z-50 border-b px-6 py-4 flex justify-between items-center transition-colors"
        style={{
          background: theme === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(3,7,18,0.85)',
          backdropFilter: 'blur(20px)',
          borderColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
        }}
      >
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="relative">
            <div className="absolute inset-0 rounded-xl blur-md opacity-50"
              style={{ background: 'radial-gradient(circle, #00f5ff 0%, transparent 70%)' }} />
            <div className="relative border border-cyan-500/20 p-2 rounded-xl" style={{background: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)'}}>
              <Shield className="text-cyan-400 w-5 h-5" />
            </div>
          </div>
          <span className="font-bold text-lg tracking-tight" style={{color: theme === 'light' ? '#0f172a' : '#ffffff'}}>
            Car Intelligence
          </span>
        </div>
        
        <div className="flex flex-row items-center gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-lg opacity-70 hover:opacity-100 transition-opacity">
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          
          {user ? (
            <div className="flex flex-row items-center gap-4">
               <span className="text-sm opacity-70 hidden md:flex items-center gap-2">
                 <UserCircle className="w-4 h-4" /> {user.email}
               </span>
               <button onClick={logout} className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors">
                 <LogOut className="w-5 h-5" />
               </button>
            </div>
          ) : (
            !isAuthPage && (
              <button onClick={() => navigate('/login')} className="px-4 py-2 rounded-lg bg-cyan-500 text-[#0f172a] font-bold text-sm hover:bg-cyan-400 transition-colors">
                Sign In
              </button>
            )
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto mt-20 pb-24 relative z-10 w-full"
            style={{
               color: theme === 'light' ? '#0f172a' : '#ffffff'
            }}>
        {children}
      </main>

      {/* ── Bottom Navigation Float ── */}
      {!isAuthPage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all shadow-2xl"
               style={{
                 background: theme === 'light' ? 'rgba(255,255,255,1)' : 'rgba(3,7,18,1)',
                 backdropFilter: 'blur(20px)',
                 borderColor: theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
               }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-1 min-w-[70px] p-2 rounded-xl transition-all ${active ? 'bg-cyan-500 text-white' : 'hover:bg-cyan-500/10'}`}
                  style={{ color: active ? '#fff' : (theme === 'light' ? '#64748b' : '#94a3b8') }}
                >
                  <Icon className="w-5 h-5" style={{ filter: active ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : 'none' }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Dynamic Background Base */}
      <div className="fixed inset-0 -z-50 pointer-events-none transition-colors duration-500"
           style={{ background: theme === 'light' ? '#f8fafc' : '#030712' }} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/analysis" element={<AiAnalysis />} />
              <Route path="/garage" element={<GarageFinder />} />
              <Route path="/manual-claim" element={<ManualClaim />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/architecture" element={<ArchitectureDiagrams />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
