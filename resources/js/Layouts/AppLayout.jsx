import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Sprout,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';

export default function AppLayout({ children, title = 'OptimusFarm' }) {
  const { auth } = usePage().props;
  const user = auth?.user;
  
  // Tentukan role, default 'user'
  const role = user?.role ?? 'user';
  const url = usePage().url;
  
  // State untuk mengontrol buka/tutup menu di mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tentukan link secara dinamis berdasarkan role agar cocok dengan route di web.php
  const isManagement = role === 'admin' || role === 'manager';
  const lahanHref = isManagement ? '/manager/lahan' : '/user/dashboard';
  const consoleHref = '/manager/dashboard';

  // Susun Menu Navigasi Universal
  const nav = [
    { label: 'Dashboard', href: '/dashboard-universal', icon: LayoutDashboard },
    { label: 'Lahan', href: lahanHref, icon: Sprout },
    // Menu Console Admin hanya muncul untuk admin / manager
    ...(isManagement ? [{ label: 'Console Admin', href: consoleHref, icon: ShieldCheck }] : []),
    { label: 'Jobdesk', href: '/jobdesks', icon: ClipboardList }
  ];

  const logout = (e) => {
    e.preventDefault();
    router.post('/logout');
  };

  // Helper untuk mengecek status aktif menu
  const isNavActive = (itemHref) => {
    if (itemHref === '/dashboard-universal') {
      return url === '/dashboard-universal' || url === '/dashboard';
    }
    return url.startsWith(itemHref);
  };

  return (
    <div className="min-h-screen bg-[#f8f7f2] text-emerald-950 font-['Manrope',sans-serif]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-emerald-950/95 backdrop-blur text-emerald-50 border-b border-emerald-900/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/dashboard-universal" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-emerald-950/20 flex-shrink-0">
              <img 
                src="/favicon.ico" 
                alt="OptimusFarm Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="font-['Sora',sans-serif] font-bold tracking-tight text-lg leading-none">
                Optimus<span className="text-amber-300">Farm</span>
              </div>
              <div className="text-xs text-emerald-300/80 mt-0.5 font-['Manrope',sans-serif]">
                {url === '/dashboard-universal'
                  ? 'Dashboard Utama'
                  : (isManagement ? 'Admin Console' : 'Petani Dashboard')}
              </div>
            </div>
          </Link>

          {/* Menu Navigasi Desktop */}
          <nav className="hidden md:flex items-center gap-1 font-['Manrope',sans-serif]">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item.href);

              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors inline-flex items-center gap-2 ${
                    active
                      ? 'bg-emerald-900 text-amber-300 shadow-inner font-bold'
                      : 'text-emerald-100/90 hover:bg-emerald-900/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile, Logout & Mobile Menu Button */}
          <div className="flex items-center gap-3 font-['Manrope',sans-serif]">
            {user && (
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-white leading-tight">{user.name}</div>
                <div className="text-xs text-emerald-300/80">{user.email}</div>
              </div>
            )}
            <button
              onClick={logout}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100 text-sm font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>

            {/* Tombol Hamburger untuk HP */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-emerald-900/60 text-emerald-100 hover:bg-emerald-800"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Dropdown Menu Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-emerald-900/60 px-6 py-4 bg-emerald-950 space-y-3">
            {user && (
              <div className="pb-3 border-b border-emerald-900/60">
                <div className="text-sm font-semibold text-white">{user.name}</div>
                <div className="text-xs text-emerald-300/80">{user.email}</div>
              </div>
            )}
            
            <div className="flex flex-col gap-1.5">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(item.href);

                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2.5 ${
                      active
                        ? 'bg-emerald-900 text-amber-300 shadow-inner font-bold'
                        : 'text-emerald-100/90 hover:bg-emerald-900/60 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-emerald-900/60">
              <button
                onClick={logout}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-900/40 hover:bg-red-900/60 text-red-200 text-sm font-medium transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 font-['Manrope',sans-serif]">
        {title && (
          <h1 className="sr-only">{title}</h1>
        )}
        {children}
      </main>
    </div>
  );
}