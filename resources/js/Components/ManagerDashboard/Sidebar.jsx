import { useState } from 'react';
import { Leaf, LogOut, X, LayoutDashboard, MessageSquareText, BarChart3, Settings, Camera } from 'lucide-react';

const modules = [
  { id: 'pms', label: 'Manager PMS', icon: LayoutDashboard },
  { id: 'cs', label: 'Customer Service', icon: MessageSquareText },
  { id: 'greenhouse', label: 'PJ Greenhouse', icon: Leaf },
  { id: 'finance', label: 'Akuntansi & Marketing', icon: BarChart3 },
];

export default function Sidebar({ 
  active, 
  setActive, 
  open, 
  setOpen, 
  user, 
  handleLogout, 
  brandTitle, 
  setBrandTitle, 
  brandSubtitle, 
  setBrandSubtitle,
  brandLogo,
  setBrandLogo,
  userAvatar,
  setUserAvatar,
  onUpdateUser 
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempBrandTitle, setTempBrandTitle] = useState(brandTitle || 'AroidMarket');
  const [tempBrandSubtitle, setTempBrandSubtitle] = useState(brandSubtitle || 'OPERATIONAL HUB');
  const [tempName, setTempName] = useState(user?.name || '');
  const [tempRole, setTempRole] = useState(user?.role || '');
  
  // State untuk preview gambar lokal saat dipilih di form pengaturan
  const [tempBrandLogo, setTempBrandLogo] = useState(brandLogo || null);
  const [tempUserAvatar, setTempUserAvatar] = useState(userAvatar || null);

  const getInitial = (name) => name ? name.substring(0, 2).toUpperCase() : 'US';

  // Handler untuk mengubah logo Aroid Market lewat file lokal
  const handleBrandLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setTempBrandLogo(imageUrl);
    }
  };

  // Handler untuk mengubah foto profil manager lewat file lokal
  const handleUserAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setTempUserAvatar(imageUrl);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (setBrandTitle) setBrandTitle(tempBrandTitle);
    if (setBrandSubtitle) setBrandSubtitle(tempBrandSubtitle);
    if (setBrandLogo) setBrandLogo(tempBrandLogo);
    if (setUserAvatar) setUserAvatar(tempUserAvatar);
    if (onUpdateUser) {
      onUpdateUser({ ...user, name: tempName, role: tempRole });
    }
    setIsSettingsOpen(false);
  };

  return (
    <>
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark overflow-hidden flex items-center justify-center">
            {brandLogo ? (
              <img src={brandLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Leaf size={19} />
            )}
          </div>
          <div>
            <strong>{brandTitle || 'Aroid'}<span>{brandTitle ? '' : 'Market'}</span></strong>
            <small>{brandSubtitle || 'OPERATIONAL HUB'}</small>
          </div>
          <button className="icon-button sidebar-close" onClick={() => setOpen(false)} aria-label="Tutup menu">
            <X size={18} />
          </button>
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

          <div className="nav-group">
            <p className="nav-label">LAINNYA</p>
            <button 
              className={`nav-item ${active === 'settings' ? 'active' : ''}`} 
              onClick={() => { setIsSettingsOpen(true); setOpen(false); }}
            >
              <Settings size={18} />
              <span>Pengaturan</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="profile-mini flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="avatar overflow-hidden flex items-center justify-center bg-emerald-800 text-white font-bold">
                {userAvatar ? (
                  <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  getInitial(user?.name)
                )}
              </div>
              <div>
                <strong>{user?.name || 'Manager'}</strong>
                <small>{user?.role || 'manager_pms'}</small>
              </div>
            </div>
            <button onClick={handleLogout} className="text-red-600 hover:text-red-800 p-1" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Modal Pengaturan dengan opsi Ganti Foto Aroid Market & Foto Profil */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-800 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Pengaturan Hub, Logo & Profil</h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              
              {/* Ganti Foto / Logo Aroid Market */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ganti Foto / Logo Aroid Market</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                    {tempBrandLogo ? (
                      <img src={tempBrandLogo} alt="Preview Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Leaf size={20} className="text-emerald-700" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleBrandLogoChange}
                    className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Brand / Hub</label>
                <input 
                  type="text" 
                  value={tempBrandTitle} 
                  onChange={(e) => setTempBrandTitle(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sub-judul Hub</label>
                <input 
                  type="text" 
                  value={tempBrandSubtitle} 
                  onChange={(e) => setTempBrandSubtitle(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <hr className="my-2 border-gray-200" />

              {/* Ganti Foto Profil Manager */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ganti Foto Profil Manager</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center overflow-hidden bg-emerald-800 text-white font-bold">
                    {tempUserAvatar ? (
                      <img src={tempUserAvatar} alt="Preview Avatar" className="w-full h-full object-cover" />
                    ) : (
                      getInitial(tempName)
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleUserAvatarChange}
                    className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Manager</label>
                <input 
                  type="text" 
                  value={tempName} 
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Role / Jabatan</label>
                <input 
                  type="text" 
                  value={tempRole} 
                  onChange={(e) => setTempRole(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button 
                  type="button" 
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-300"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}