import { Settings, Power, Disc3 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function TopHeader({ activeTab, onTabChange, onOpenSettings }) {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const tabs = ['Studies', 'Query/Retrieve', 'Job Queue'];

  return (
    <header className="h-16 border-b border-ot-border/50 bg-ot-bg-top/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-[100] shadow-lg shadow-black/20">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 flex items-center justify-center">
          <img
            src="/assets/cd-logo.png"
            alt="Raster DICOM"
            className="w-16 h-16 object-contain"
          />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white leading-none">Raster DICOM</h1>
          <p className="text-ot-text-muted text-[10px] uppercase tracking-[0.3em] font-bold mt-1">Diagnostic Suite</p>
        </div>
      </div>

      {/* Shadcn Tabs Navigation */}
      <nav className="hidden lg:block">
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList>
            {tabs.map(tab => (
              <TabsTrigger key={tab} value={tab}>
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="text-sm font-bold text-white leading-none">
            {user?.username || 'Guest'}
          </span>
          <span className="text-[10px] text-ot-text-muted font-bold uppercase tracking-tighter mt-1 opacity-70">
            {role === 'Admin' ? 'Super Administrator' : (role ? `${role.charAt(0).toUpperCase() + role.slice(1)} Mode` : 'No Role')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.href = '/cd-studio'}
            className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-400/20 hover:bg-blue-500/20 hover:border-blue-400/40 transition-all outline-none text-blue-400 group flex items-center gap-2 px-3"
            title="CD Design Studio"
          >
            <Disc3 size={16} className="transition-transform group-hover:rotate-12" />
            <span className="text-[11px] font-bold hidden xl:inline tracking-wide">CD Studio</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            title="Settings"
            className="
    flex items-center justify-center
    w-10 h-10 rounded-xl
    border border-amber-500/40
    bg-amber-500/10
    text-amber-500
    hover:bg-amber-500 hover:text-white
    hover:border-amber-500
    transition-all duration-200
    shadow-sm hover:shadow-amber-500/30
    active:scale-95
  "
          >
            <Settings size={18} strokeWidth={2.5} />
          </button>
          <button
            className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500 hover:text-white transition-all outline-none text-pink-500 group"
            onClick={() => {
              logout();
              localStorage.clear(); // forcefully ensure everything is wiped
              navigate('/', { replace: true });
            }}
          >
            <Power size={18} className="transition-transform group-hover:scale-110" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
