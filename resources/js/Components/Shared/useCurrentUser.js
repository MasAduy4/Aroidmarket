import { useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';

const STORAGE_PREFIX = 'aroidmarket.profile';

function storageKey(userId, field) {
  return `${STORAGE_PREFIX}.${userId}.${field}`;
}

/**
 * Database / Inertia adalah sumber utama identitas user.
 *
 * localStorage hanya dipakai untuk cache-busting avatar,
 * bukan untuk mengganti nama user.
 */
function buildUser(user) {
  if (!user) {
    return null;
  }

  if (typeof window === 'undefined' || !user?.id) {
    return {
      ...user,
      __avatarVersion: '0',
    };
  }

  const avatarVersion =
    window.localStorage.getItem(
      storageKey(user.id, 'avatar_version')
    ) || '0';

  return {
    ...user,
    __avatarVersion: avatarVersion,
  };
}

export function useCurrentUser(fallbackUser = null) {
  const { props } = usePage();

  /*
  |--------------------------------------------------------------------------
  | User utama
  |--------------------------------------------------------------------------
  |
  | Selalu prioritaskan auth.user dari Laravel/Inertia.
  |
  */
  const sharedUser =
    props?.auth?.user ||
    fallbackUser ||
    null;

  const [user, setUser] = useState(() =>
    buildUser(sharedUser)
  );

  const [loading, setLoading] = useState(
    !sharedUser
  );

  /*
  |--------------------------------------------------------------------------
  | Initial / refreshed user
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    let cancelled = false;

    if (sharedUser) {
      setUser(buildUser(sharedUser));
      setLoading(false);

      return undefined;
    }

    fetch('/profile/current', {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Gagal mengambil profil (${response.status}).`
          );
        }

        return response.json();
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setUser(
          buildUser(payload.user || null)
        );
      })
      .catch((error) => {
        if (!cancelled) {
          console.error(
            'Gagal mengambil profil pengguna:',
            error
          );

          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    sharedUser?.id,
    sharedUser?.name,
    sharedUser?.email,
    sharedUser?.role,
    sharedUser?.phone,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Listen for profile changes
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const sync = () => {
      /*
       * Jangan membaca nama dari localStorage.
       * Ambil user terbaru dari Inertia page props.
       *
       * Inertia akan memperbarui props setelah
       * router.post() berhasil.
       */
      setUser(buildUser(sharedUser));
    };

    window.addEventListener(
      'aroidmarket:profile-updated',
      sync
    );

    window.addEventListener(
      'storage',
      sync
    );

    return () => {
      window.removeEventListener(
        'aroidmarket:profile-updated',
        sync
      );

      window.removeEventListener(
        'storage',
        sync
      );
    };
  }, [
    sharedUser?.id,
    sharedUser?.name,
    sharedUser?.role,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Avatar URL
  |--------------------------------------------------------------------------
  */
  const avatarUrl = useMemo(() => {
    if (!user?.id) {
      return null;
    }

    const version = encodeURIComponent(
      user.__avatarVersion || '0'
    );

    return `/profile/avatar?v=${version}`;
  }, [
    user?.id,
    user?.__avatarVersion,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Company Logo URL
  |--------------------------------------------------------------------------
  */
  const companyLogoVersion =
    typeof window !== 'undefined'
      ? window.localStorage.getItem(
          `${STORAGE_PREFIX}.company_logo_version`
        ) || '0'
      : '0';

  const companyLogoUrl =
    `/company/logo?v=${encodeURIComponent(
      companyLogoVersion
    )}`;

  return {
    user,
    avatarUrl,
    companyLogoUrl,
    loading,
  };
}

/**
 * Notify all components on the current page
 * that the profile was updated.
 */
export function notifyProfileUpdated(
  updatedUser,
  avatarChanged = false,
  companyLogoChanged = false
) {
  if (
    typeof window === 'undefined' ||
    !updatedUser?.id
  ) {
    return;
  }

  /*
  |--------------------------------------------------------------------------
  | Avatar cache version
  |--------------------------------------------------------------------------
  */
  if (avatarChanged) {
    window.localStorage.setItem(
      storageKey(
        updatedUser.id,
        'avatar_version'
      ),
      String(Date.now())
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Company logo cache version
  |--------------------------------------------------------------------------
  */
  if (companyLogoChanged) {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}.company_logo_version`,
      String(Date.now())
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Global frontend event
  |--------------------------------------------------------------------------
  */
  window.dispatchEvent(
    new CustomEvent(
      'aroidmarket:profile-updated'
    )
  );
}