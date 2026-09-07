import { useEffect, useState } from 'react';
import { useCurrentUser } from './useCurrentUser';

export default function HeaderUserProfile({
  fallbackUser = null,
  compact = false,
  dark = false,
}) {
  const { user, avatarUrl } = useCurrentUser(fallbackUser);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  const getInitial = (name) =>
    name ? name.substring(0, 2).toUpperCase() : 'US';

  const name = user?.name || 'User';
  const role = user?.role || 'User';

  const avatar = avatarUrl && !avatarError ? (
    <img
      src={avatarUrl}
      alt={`Foto profil ${name}`}
      className="w-full h-full object-cover"
      onError={() => setAvatarError(true)}
    />
  ) : (
    getInitial(name)
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-[30px] h-[30px] rounded-full overflow-hidden flex items-center justify-center shrink-0 font-bold text-xs ${
            dark
              ? 'bg-[#2f6850] text-white'
              : 'bg-emerald-100 text-[#2f6850]'
          }`}
        >
          {avatar}
        </div>

        <div className="min-w-0">
          <strong
            className={`block text-xs font-semibold truncate ${
              dark ? 'text-white' : 'text-[#1c2826]'
            }`}
          >
            {name}
          </strong>

          <small
            className={`block text-[10px] truncate ${
              dark ? 'text-white/60' : 'text-[#8c9087]'
            }`}
          >
            {role}
          </small>
        </div>
      </div>
    );
  }

  return (
    <div className="header-profile">
      <div className="avatar overflow-hidden flex items-center justify-center bg-emerald-100 text-[#2f6850] font-bold">
        {avatar}
      </div>

      <div>
        <strong>{name}</strong>
        <small>{role}</small>
      </div>
    </div>
  );
}
