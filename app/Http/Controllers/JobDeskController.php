<?php

namespace App\Http\Controllers;

use App\Models\JobDesk;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\CarbonImmutable;

class JobDeskController extends Controller
{
    private function isManager(): bool
    {
        return Auth::user()?->role === 'manager_pms';
    }

    private function activeWeekStart(): CarbonImmutable
    {
        return CarbonImmutable::now('Asia/Jakarta')->startOfWeek(CarbonImmutable::MONDAY);
    }

    private function isOperationalUser(): bool
    {
        return in_array(
            Auth::user()?->role,
            [
                'customer_service',
                'pj_greenhouse',
                'akuntansi_marketing',
            ],
            true
        );
    }

    public function index()
    {
        $user = Auth::user();

        abort_unless(
            $this->isManager() || $this->isOperationalUser(),
            403,
            'Anda tidak memiliki akses ke JobDesk.'
        );

        if ($this->isManager()) {
            $jobDesks = JobDesk::with(['user', 'manager'])
                ->where('created_at', '>=', $this->activeWeekStart())
                ->latest()
                ->get();

            $users = User::query()
                ->whereIn('role', [
                    'customer_service',
                    'pj_greenhouse',
                    'akuntansi_marketing',
                ])
                ->where('is_active', true)
                ->orderBy('role')
                ->orderBy('name')
                ->get(['id', 'name', 'role']);
        } else {
            $jobDesks = JobDesk::with(['user', 'manager'])
                ->where('user_id', $user->id)
                ->where('created_at', '>=', $this->activeWeekStart())
                ->latest()
                ->get();

            $users = collect([$user->only(['id', 'name', 'role'])]);
        }

        return \Inertia\Inertia::render('JobDesks/Index', [
            'jobDesks' => $jobDesks,
            'users' => $users,
        ]);
    }

    public function mine()
    {
        abort_unless(
            $this->isOperationalUser(),
            403,
            'Endpoint ini hanya dapat digunakan oleh user operasional.'
        );

        $jobDesks = JobDesk::with([
            'manager:id,name,role',
        ])
            ->where('user_id', Auth::id())
            ->where('created_at', '>=', $this->activeWeekStart())
            ->latest()
            ->get([
                'id',
                'user_id',
                'assigned_by',
                'title',
                'description',
                'target_date',
                'status',
                'created_at',
                'updated_at',
            ]);

        return response()->json([
            'data' => $jobDesks,
        ]);
    }

    public function store(Request $request)
    {
        abort_unless(
            $this->isManager(),
            403,
            'Hanya Manager PMS yang dapat membuat JobDesk.'
        );

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'target_date' => ['required', 'date'],
        ]);

        $assignedUser = User::query()
            ->whereKey($validated['user_id'])
            ->whereIn('role', [
                'customer_service',
                'pj_greenhouse',
                'akuntansi_marketing',
            ])
            ->where('is_active', true)
            ->first();

        abort_unless($assignedUser, 422, 'User tujuan tidak valid.');

        JobDesk::create([
            'user_id' => $assignedUser->id,
            'assigned_by' => Auth::id(),
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'target_date' => $validated['target_date'],
            'status' => 'pending',
        ]);

        return back()->with('success', 'Jobdesk berhasil diberikan.');
    }

    public function updateStatus(Request $request, JobDesk $jobDesk)
    {
        abort_unless(
            $this->isManager(),
            403,
            'Hanya Manager PMS yang dapat mengubah status JobDesk.'
        );

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending,in_progress,completed,validated'],
        ]);

        $jobDesk->update([
            'status' => $validated['status'],
        ]);

        return back()->with('success', 'Status JobDesk berhasil diperbarui.');
    }

    public function complete(JobDesk $jobDesk)
    {
        abort_unless(
            $this->isOperationalUser(),
            403,
            'Role Anda tidak dapat menyelesaikan JobDesk.'
        );

        abort_unless(
            (int) $jobDesk->user_id === (int) Auth::id(),
            403,
            'Anda hanya dapat menyelesaikan JobDesk milik Anda sendiri.'
        );

        if ($jobDesk->status === 'validated') {
            return back()->with('error', 'JobDesk yang sudah divalidasi tidak dapat diubah.');
        }

        $jobDesk->update([
            'status' => 'completed',
        ]);

        return response()->json([
            'message' => 'Jobdesk ditandai selesai.',
        ]);
    }

    public function validateJob(JobDesk $jobDesk)
    {
        abort_unless(
            $this->isManager(),
            403,
            'Hanya Manager PMS yang dapat memvalidasi JobDesk.'
        );

        abort_unless(
            $jobDesk->status === 'completed',
            422,
            'JobDesk harus diselesaikan terlebih dahulu.'
        );

        $jobDesk->update([
            'status' => 'validated',
        ]);

        return back()->with('success', 'Jobdesk berhasil divalidasi.');
    }

    public function destroy(JobDesk $jobDesk)
    {
        abort_unless(
            $this->isManager(),
            403,
            'Hanya Manager PMS yang dapat menghapus JobDesk.'
        );

        $jobDesk->delete();

        return back()->with('success', 'Jobdesk berhasil dihapus.');
    }
}
