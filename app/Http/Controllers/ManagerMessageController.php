<?php

namespace App\Http\Controllers;

use App\Models\ManagerMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ManagerMessageController extends Controller
{
    private function isManager(): bool
    {
        return Auth::user()?->role === 'manager_pms';
    }

    private function isOperationalUser(): bool
    {
        return in_array(Auth::user()?->role, [
            'customer_service',
            'pj_greenhouse',
            'akuntansi_marketing',
        ], true);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless(
            $this->isOperationalUser(),
            403,
            'Hanya Customer Service, PJ Greenhouse, dan Akuntansi & Marketing yang dapat mengirim pesan ke Manager PMS.'
        );

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        ManagerMessage::create([
            'user_id' => Auth::id(),
            'message' => trim($validated['message']),
        ]);

        return back()->with('success', 'Pesan berhasil dikirim ke Manager PMS.');
    }

    public function destroy(ManagerMessage $managerMessage): RedirectResponse
    {
        abort_unless(
            $this->isManager(),
            403,
            'Hanya Manager PMS yang dapat menghapus pesan laporan.'
        );

        $managerMessage->delete();

        return back()->with('success', 'Pesan laporan berhasil dihapus.');
    }
}
