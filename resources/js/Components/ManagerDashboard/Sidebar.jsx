import { useEffect, useState } from 'react';
import { Leaf, LogOut, X, LayoutDashboard, MessageSquareText, BarChart3, Settings } from 'lucide-react';
import ProfileSettingsModal from '@/Components/Shared/ProfileSettingsModal';
import HeaderUserProfile from '@/Components/Shared/HeaderUserProfile';
import { useCurrentUser } from '@/Components/Shared/useCurrentUser';

const modules = [
  { id: 'pms', label: 'Manager PMS', icon: LayoutDashboard },
  { id: 'cs', label: 'Customer Service', icon: MessageSquareText },
  { id: 'greenhouse', label: 'PJ Greenhouse', icon: Leaf },
  { id: 'finance', label: 'Akuntansi & Marketing', icon: BarChart3 },
];

export default function Sidebar({ active, setActive, open, setOpen, user: fallbackUser, handleLogout }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { user } = useCurrentUser(fallbackUser);

  const [companyLogoUrl, setCompanyLogoUrl] = useState(() => {
    if (typeof window === 'undefined') {
      return '/company/logo';
    }

    const version =
      window.localStorage.getItem('aroidmarket.profile.company_logo_version') ||
      '0';

    return `/company/logo?v=${encodeURIComponent(version)}`;
  });

  useEffect(() => {
    const refreshCompanyLogo = () => {
      const version =
        window.localStorage.getItem('aroidmarket.profile.company_logo_version') ||
        Date.now().toString();

      setCompanyLogoUrl(
        `/company/logo?v=${encodeURIComponent(version)}`
      );
    };

    window.addEventListener('aroidmarket:profile-updated', refreshCompanyLogo);

    return () => {
      window.removeEventListener('aroidmarket:profile-updated', refreshCompanyLogo);
    };
  }, []);

  return (
    <>
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark overflow-hidden flex items-center justify-center">
            {companyLogoUrl ? (
              <img src={companyLogoUrl} alt="Logo perusahaan" className="w-full h-full object-cover" />
            ) : (
              <Leaf size={19} />
            )}
          </div>
          <div>
            <strong>Aroid<span>Market</span></strong>
            <small>OPERATIONAL HUB</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            <p className="nav-label">WORKSPACE</p>
            {modules.map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                className={`nav-item ${active === id ? 'active' : ''}`}
                onClick={() => { setActive(id); setOpen(false); }}
              >
                <Icon size={18} />
                <span>{label}</span>
                {count && <em>{count}</em>}
              </button>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 text-xs text-white/70 bg-transparent border-none cursor-pointer px-2 hover:text-white transition-colors text-left"
          >
            <Settings size={25} /> Pengaturan
          </button>

          <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-[10px] border border-white/5">
            <HeaderUserProfile fallbackUser={user} compact dark />
            <button
              onClick={handleLogout}
              className="border-none bg-red-500/20 text-red-300 p-1.5 rounded-[6px] cursor-pointer flex items-center justify-center hover:bg-red-500/30 transition-colors"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <ProfileSettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        fallbackUser={user}
      />
    </>
  );
}
