import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import {
  notifyProfileUpdated,
  useCurrentUser,
} from './useCurrentUser';

const MANAGER_ROLE = 'manager_pms';

export default function ProfileSettingsModal({
  open,
  onClose,
  fallbackUser = null,
}) {
  const {
    user,
    companyLogoUrl,
  } = useCurrentUser(fallbackUser);

  const isManager =
    user?.role === MANAGER_ROLE;

  /*
  |--------------------------------------------------------------------------
  | Form state
  |--------------------------------------------------------------------------
  */
  const [name, setName] = useState(
    user?.name || ''
  );

  const [avatarFile, setAvatarFile] =
    useState(null);

  const [avatarPreview, setAvatarPreview] =
    useState(null);

  const [companyLogoFile, setCompanyLogoFile] =
    useState(null);

  const [companyLogoPreview, setCompanyLogoPreview] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  /*
  |--------------------------------------------------------------------------
  | Reset form when modal opens / user changes
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (!open) {
      return;
    }

    setName(user?.name || '');

    setAvatarFile(null);
    setAvatarPreview(null);

    setCompanyLogoFile(null);
    setCompanyLogoPreview(null);

    setErrorMessage('');
  }, [
    open,
    user?.id,
    user?.name,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Cleanup blob URLs
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    return () => {
      if (
        avatarPreview?.startsWith('blob:')
      ) {
        URL.revokeObjectURL(
          avatarPreview
        );
      }

      if (
        companyLogoPreview?.startsWith('blob:')
      ) {
        URL.revokeObjectURL(
          companyLogoPreview
        );
      }
    };
  }, [
    avatarPreview,
    companyLogoPreview,
  ]);

  if (!open) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */
  const getInitial = (value) => {
    return value
      ? value.substring(0, 2).toUpperCase()
      : 'US';
  };

  /*
  |--------------------------------------------------------------------------
  | Preview URLs
  |--------------------------------------------------------------------------
  */
  const avatarUrl =
    avatarPreview ||
    (
      user?.id
        ? `/profile/avatar?v=${encodeURIComponent(
            user.__avatarVersion || '0'
          )}`
        : null
    );

  const logoUrl =
    companyLogoPreview ||
    companyLogoUrl ||
    null;

  /*
  |--------------------------------------------------------------------------
  | Image validation
  |--------------------------------------------------------------------------
  */
  const validateImage = (
    file,
    label
  ) => {
    if (!file) {
      return false;
    }

    if (
      ![
        'image/jpeg',
        'image/png',
        'image/webp',
      ].includes(file.type)
    ) {
      setErrorMessage(
        `${label} harus JPG, PNG, atau WebP.`
      );

      return false;
    }

    if (
      file.size >
      2 * 1024 * 1024
    ) {
      setErrorMessage(
        `Ukuran ${label.toLowerCase()} maksimal 2 MB.`
      );

      return false;
    }

    return true;
  };

  /*
  |--------------------------------------------------------------------------
  | Name change
  |--------------------------------------------------------------------------
  */
  const handleNameChange = (event) => {
    setName(event.target.value);
    setErrorMessage('');
  };

  /*
  |--------------------------------------------------------------------------
  | Avatar change
  |--------------------------------------------------------------------------
  */
  const handleAvatarChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !validateImage(
        file,
        'Foto profil'
      )
    ) {
      event.target.value = '';
      return;
    }

    if (
      avatarPreview?.startsWith(
        'blob:'
      )
    ) {
      URL.revokeObjectURL(
        avatarPreview
      );
    }

    setAvatarFile(file);

    setAvatarPreview(
      URL.createObjectURL(file)
    );

    setErrorMessage('');
  };

  /*
  |--------------------------------------------------------------------------
  | Company logo change
  |--------------------------------------------------------------------------
  */
  const handleCompanyLogoChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !validateImage(
        file,
        'Foto perusahaan'
      )
    ) {
      event.target.value = '';
      return;
    }

    if (
      companyLogoPreview?.startsWith(
        'blob:'
      )
    ) {
      URL.revokeObjectURL(
        companyLogoPreview
      );
    }

    setCompanyLogoFile(file);

    setCompanyLogoPreview(
      URL.createObjectURL(file)
    );

    setErrorMessage('');
  };

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */
  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedName =
      name.trim();

    if (!trimmedName) {
      setErrorMessage(
        'Nama wajib diisi.'
      );

      return;
    }

    const nameChanged =
      trimmedName !==
      (user?.name || '').trim();

    const hasChanges =
      nameChanged ||
      Boolean(avatarFile) ||
      Boolean(
        isManager &&
        companyLogoFile
      );

    if (!hasChanges) {
      setErrorMessage(
        'Tidak ada perubahan yang disimpan.'
      );

      return;
    }

    setSaving(true);
    setErrorMessage('');

    const payload =
      new FormData();

    /*
     * Nama selalu dikirim.
     */
    payload.append(
      'name',
      trimmedName
    );

    /*
     * Avatar user sendiri.
     */
    if (avatarFile) {
      payload.append(
        'avatar',
        avatarFile
      );
    }

    /*
     * Company logo hanya Manager.
     */
    if (
      isManager &&
      companyLogoFile
    ) {
      payload.append(
        'company_logo',
        companyLogoFile
      );
    }

    router.post(
      '/profile/settings',
      payload,
      {
        forceFormData: true,
        preserveScroll: true,

        /*
        |--------------------------------------------------------------------------
        | Success
        |--------------------------------------------------------------------------
        */
        onSuccess: () => {
          notifyProfileUpdated(
            {
              ...user,
              name: trimmedName,
            },
            Boolean(avatarFile),
            Boolean(
              isManager &&
              companyLogoFile
            )
          );

          setSaving(false);

          onClose?.();
        },

        /*
        |--------------------------------------------------------------------------
        | Error
        |--------------------------------------------------------------------------
        */
        onError: (errors) => {
          console.error(
            'Gagal menyimpan pengaturan profil:',
            errors
          );

          const firstError =
            Object.values(
              errors || {}
            )[0];

          setErrorMessage(
            Array.isArray(
              firstError
            )
              ? firstError[0]
              : firstError ||
                  'Gagal menyimpan perubahan profil.'
          );

          setSaving(false);
        },

        /*
        |--------------------------------------------------------------------------
        | Finish
        |--------------------------------------------------------------------------
        */
        onFinish: () => {
          setSaving(false);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-800 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold">
              Pengaturan Profil
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              {isManager
                ? 'Kelola nama, foto perusahaan, dan foto profil.'
                : 'Kelola nama dan foto profil akun Anda.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* ============================================================
              NAMA USER
          ============================================================ */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Nama
            </label>

            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              disabled={saving}
              required
              maxLength={255}
              placeholder="Masukkan nama Anda"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
            />
          </div>

          {/* ============================================================
              COMPANY LOGO
              HANYA MANAGER PMS
          ============================================================ */}
          {isManager && (
            <div className="border-t border-gray-100 pt-5">

              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Foto Perusahaan
              </label>

              <div className="flex items-center gap-3">

                <div className="w-14 h-14 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">

                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo perusahaan"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-emerald-700 font-bold text-xs">
                      AM
                    </span>
                  )}

                </div>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleCompanyLogoChange
                  }
                  disabled={saving}
                  className="text-xs w-full"
                />

              </div>
            </div>
          )}

          {/* ============================================================
              PROFILE AVATAR
          ============================================================ */}
          <div
            className={
              isManager
                ? 'border-t border-gray-100 pt-5'
                : 'border-t border-gray-100 pt-5'
            }
          >

            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Foto Profil
            </label>

            <div className="flex items-center gap-3">

              <div className="w-14 h-14 rounded-full border border-gray-200 overflow-hidden bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">

                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={`Foto profil ${
                      user?.name || ''
                    }`}
                    className="w-full h-full object-cover"
                    onError={(
                      event
                    ) => {
                      event.currentTarget.style.display =
                        'none';
                    }}
                  />
                ) : (
                  getInitial(
                    user?.name
                  )
                )}

              </div>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handleAvatarChange
                }
                disabled={saving}
                className="text-xs w-full"
              />

            </div>
          </div>

          {/* ============================================================
              ERROR MESSAGE
          ============================================================ */}
          {errorMessage && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {errorMessage}
            </div>
          )}

          {/* ============================================================
              BUTTONS
          ============================================================ */}
          <div className="flex justify-end gap-2 pt-2">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-60"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving
                ? 'Menyimpan...'
                : 'Simpan Perubahan'}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}