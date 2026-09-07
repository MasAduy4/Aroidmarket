<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = Auth::user();

        /*
        |--------------------------------------------------------------------------
        | Redirect sesuai role
        |--------------------------------------------------------------------------
        */

        return match ($user->role) {

            // Manager PMS
            'manager_pms' => redirect()->route(
                'manager.dashboard'
            ),

            // Customer Service
            'customer_service' => redirect()->route(
                'customer-service.index'
            ),

            // PJ Greenhouse / Petani
            'pj_greenhouse' => redirect()->route(
                'greenhouse.plants.index'
            ),

            // Akuntansi & Marketing
            'akuntansi_marketing' => redirect()->route(
                'akuntansi.index'
            ),

            // Role tidak dikenal
            default => redirect()->route('login')->withErrors([
                'email' => 'Role akun tidak dikenali.',
            ]),
        };
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}