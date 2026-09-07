<?php

namespace App\Http\Controllers;

use App\Models\ManagerMessage;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ManagerMessageController extends Controller
{
    private const OPERATIONAL_ROLES = [
        'customer_service',
        'pj_greenhouse',
        'akuntansi_marketing',
    ];

    private function isManager(): bool
    {
        return Auth::user()?->role === 'manager_pms';
    }

    private function isOperationalUser(): bool
    {
        return in_array(Auth::user()?->role, self::OPERATIONAL_ROLES, true);
    }

    /*
    |--------------------------------------------------------------------------
    | Operational User -> Manager PMS
    |--------------------------------------------------------------------------
    */
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
            'recipient_id' => null,
            'message' => trim($validated['message']),
        ]);

        return back()->with('success', 'Pesan berhasil dikirim ke Manager PMS.');
    }

    /*
    |--------------------------------------------------------------------------
    | Manager PMS -> Operational User
    |--------------------------------------------------------------------------
    */
    public function sendToUser(Request $request): RedirectResponse
    {
        abort_unless(
            $this->isManager(),
            403,
            'Hanya Manager PMS yang dapat mengirim pesan ke pengguna operasional.'
        );

        $validated = $request->validate([
            'recipient_id' => ['required', 'integer', 'exists:users,id'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $recipient = User::query()
            ->whereKey($validated['recipient_id'])
            ->whereIn('role', self::OPERATIONAL_ROLES)
            ->where('is_active', true)
            ->first();

        abort_unless(
            $recipient,
            422,
            'Penerima pesan tidak valid atau tidak aktif.'
        );

        ManagerMessage::create([
            'user_id' => Auth::id(),
            'recipient_id' => $recipient->id,
            'message' => trim($validated['message']),
        ]);

        return back()->with(
            'success',
            "Pesan berhasil dikirim ke {$recipient->name}."
        );
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
