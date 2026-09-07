<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): InertiaResponse
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's normal Laravel profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Update name, avatar, and company logo.
     *
     * Rules:
     * - All authenticated users can update their own name.
     * - All authenticated users can update their own avatar.
     * - Only manager_pms can update the company logo.
     */
    public function updateManagerSettings(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'avatar' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],

            'company_logo' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | NAME
        |--------------------------------------------------------------------------
        */
        $user->name = trim($validated['name']);

        /*
        |--------------------------------------------------------------------------
        | PROFILE AVATAR
        |--------------------------------------------------------------------------
        |
        | Tidak disimpan di database.
        | File disimpan berdasarkan user ID:
        |
        | storage/app/public/profiles/user-{id}.ext
        |
        */
        if ($request->hasFile('avatar')) {
            $this->deleteUserAvatars($user->id);

            $file = $request->file('avatar');

            $extension = strtolower(
                $file->getClientOriginalExtension()
            );

            $file->storeAs(
                'profiles',
                "user-{$user->id}.{$extension}",
                'public'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | COMPANY LOGO
        |--------------------------------------------------------------------------
        |
        | Hanya Manager PMS yang boleh mengubah logo perusahaan.
        */
        if ($request->hasFile('company_logo')) {
            abort_unless(
                $user->role === 'manager_pms',
                403,
                'Hanya Manager PMS yang dapat mengubah logo perusahaan.'
            );

            $this->deleteCompanyLogos();

            $file = $request->file('company_logo');

            $extension = strtolower(
                $file->getClientOriginalExtension()
            );

            $file->storeAs(
                'company',
                "logo.{$extension}",
                'public'
            );
        }

        $user->save();

        return back()->with('success', 'Pengaturan profil berhasil disimpan.');
    }

    /**
     * Return current authenticated user as JSON.
     */
    public function current(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    /**
     * Return current user's avatar image.
     *
     * Avatar is resolved using the authenticated user's ID.
     */
    public function avatar(Request $request): Response
    {
        $user = $request->user();

        $path = $this->findUserAvatar($user->id);

        if (! $path) {
            abort(404);
        }

        return response(
            Storage::disk('public')->get($path),
            200,
            [
                'Content-Type' => Storage::disk('public')->mimeType($path),
                'Cache-Control' => 'no-cache, must-revalidate',
            ]
        );
    }

    /**
     * Return the global company logo.
     *
     * This logo belongs to the company, not to a specific user.
     */
    public function companyLogo(): Response
    {
        $path = $this->findCompanyLogo();

        if (! $path) {
            abort(404);
        }

        return response(
            Storage::disk('public')->get($path),
            200,
            [
                'Content-Type' => Storage::disk('public')->mimeType($path),
                'Cache-Control' => 'no-cache, must-revalidate',
            ]
        );
    }

    /**
     * Delete all avatar files belonging to one user.
     */
    private function deleteUserAvatars(int $userId): void
    {
        $disk = Storage::disk('public');

        foreach (['jpg', 'jpeg', 'png', 'webp'] as $extension) {
            $path = "profiles/user-{$userId}.{$extension}";

            if ($disk->exists($path)) {
                $disk->delete($path);
            }
        }
    }

    /**
     * Find the current user's avatar.
     */
    private function findUserAvatar(int $userId): ?string
    {
        $disk = Storage::disk('public');

        foreach (['jpg', 'jpeg', 'png', 'webp'] as $extension) {
            $path = "profiles/user-{$userId}.{$extension}";

            if ($disk->exists($path)) {
                return $path;
            }
        }

        return null;
    }

    /**
     * Delete all existing company logo files.
     */
    private function deleteCompanyLogos(): void
    {
        $disk = Storage::disk('public');

        foreach (['jpg', 'jpeg', 'png', 'webp'] as $extension) {
            $path = "company/logo.{$extension}";

            if ($disk->exists($path)) {
                $disk->delete($path);
            }
        }
    }

    /**
     * Find the current company logo.
     */
    private function findCompanyLogo(): ?string
    {
        $disk = Storage::disk('public');

        foreach (['jpg', 'jpeg', 'png', 'webp'] as $extension) {
            $path = "company/logo.{$extension}";

            if ($disk->exists($path)) {
                return $path;
            }
        }

        return null;
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}