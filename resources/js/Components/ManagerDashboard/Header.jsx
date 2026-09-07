import { Menu, Bell } from 'lucide-react';
import { modules } from './constants';
import HeaderUserProfile from '@/Components/Shared/HeaderUserProfile';

export default function Header({ active, setOpen, user }) {
  const current = modules.find((item) => item.id === active);

  return (
    <header className="topbar">
      <div className="topbar-title">
        <button
          className="mobile-menu icon-button"
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <p className="eyebrow">
            WORKSPACE / {current?.label?.toUpperCase() || 'PENGATURAN'}
          </p>
          <h1>{current?.label || 'Pengaturan'}</h1>
        </div>
      </div>

      <div className="topbar-actions">
        <button className="icon-button notification" aria-label="Notifikasi">
          <Bell size={19} />
          <span />
        </button>

        <HeaderUserProfile fallbackUser={user} />
      </div>
    </header>
  );
}
