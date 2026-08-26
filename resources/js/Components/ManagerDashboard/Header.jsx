import { Menu, Bell } from 'lucide-react';
import { modules } from './constants';

export default function Header({ active, setOpen, user }) {
  const current = modules.find((item) => item.id === active)
  const getInitial = (name) => name ? name.substring(0, 2).toUpperCase() : 'US';

  return <header className="topbar">
    <div className="topbar-title"><button className="mobile-menu icon-button" onClick={() => setOpen(true)} aria-label="Buka menu"><Menu size={20} /></button><div><p className="eyebrow">WORKSPACE / {current?.label?.toUpperCase() || 'PENGATURAN'}</p><h1>{current?.label || 'Pengaturan'}</h1></div></div>
    <div className="topbar-actions">
      <button className="icon-button notification" aria-label="Notifikasi"><Bell size={19} /><span /></button>
      <div className="header-profile">
        <div className="avatar">{getInitial(user?.name)}</div>
        <div><strong>{user?.name || 'Manager'}</strong><small>{user?.role || 'Manager'}</small></div>
      </div>
    </div>
  </header>
}