<?php

namespace App\Http\Controllers;

use App\Models\JobDesk;
use App\Models\ManagerMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    private const OPERATIONAL_ROLES = [
        'customer_service',
        'pj_greenhouse',
        'akuntansi_marketing',
    ];

    public function index(): JsonResponse
    {
        $user = Auth::user();

        abort_unless(
            $user,
            401,
            'Unauthenticated.'
        );

        /*
        |--------------------------------------------------------------------------
        | Manager PMS
        |--------------------------------------------------------------------------
        | Menampilkan pesan masuk dari user operasional + JobDesk yang selesai.
        */
        if ($user->role === 'manager_pms') {
            $messages = ManagerMessage::with('user:id,name,role')
                ->whereNull('recipient_id')
                ->whereHas('user', function ($query) {
                    $query->whereIn('role', self::OPERATIONAL_ROLES);
                })
                ->latest()
                ->take(20)
                ->get()
                ->map(function ($message) {
                    return [
                        'id' => 'message-' . $message->id,
                        'type' => 'message',
                        'title' => 'Pesan Baru',
                        'description' => ($message->user?->name ?? 'User') . ' mengirim pesan ke Manager PMS.',
                        'content' => $message->message,
                        'created_at' => $message->created_at,
                        'source_id' => $message->id,
                    ];
                });

            $completedJobDesks = JobDesk::with(['user:id,name,role'])
                ->where('status', 'completed')
                ->latest('updated_at')
                ->take(20)
                ->get()
                ->map(function ($jobDesk) {
                    return [
                        'id' => 'jobdesk-' . $jobDesk->id,
                        'type' => 'jobdesk',
                        'title' => 'JobDesk Selesai',
                        'description' => ($jobDesk->user?->name ?? 'User') . ' telah menyelesaikan JobDesk "' . $jobDesk->title . '".',
                        'content' => $jobDesk->description,
                        'created_at' => $jobDesk->updated_at,
                        'source_id' => $jobDesk->id,
                    ];
                });

            $notifications = $messages
                ->concat($completedJobDesks)
                ->sortByDesc('created_at')
                ->values()
                ->take(20);

            return response()->json([
                'data' => $notifications,
                'unread_count' => $notifications->count(),
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Operational User
        |--------------------------------------------------------------------------
        | Menampilkan pesan langsung dari Manager PMS + JobDesk milik user.
        */
        abort_unless(
            in_array($user->role, self::OPERATIONAL_ROLES, true),
            403,
            'Role Anda tidak memiliki akses notifikasi.'
        );

        $messages = ManagerMessage::with('user:id,name,role')
            ->where('recipient_id', $user->id)
            ->whereHas('user', function ($query) {
                $query->where('role', 'manager_pms');
            })
            ->latest()
            ->take(20)
            ->get()
            ->map(function ($message) {
                return [
                    'id' => 'message-' . $message->id,
                    'type' => 'message',
                    'title' => 'Pesan dari Manager PMS',
                    'description' => 'Manager PMS mengirim pesan kepada Anda.',
                    'content' => $message->message,
                    'created_at' => $message->created_at,
                    'source_id' => $message->id,
                ];
            });

        $jobDesks = JobDesk::with([
            'manager:id,name,role',
        ])
            ->where('user_id', $user->id)
            ->latest()
            ->take(20)
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
            ])
            ->map(function ($jobDesk) {
                return [
                    'id' => 'jobdesk-' . $jobDesk->id,
                    'type' => 'jobdesk',
                    'title' => 'JobDesk Baru',
                    'description' => 'Anda mendapat JobDesk dari ' . ($jobDesk->manager?->name ?? 'Manager PMS') . '.',
                    'content' => $jobDesk->title,
                    'target_date' => $jobDesk->target_date,
                    'status' => $jobDesk->status,
                    'created_at' => $jobDesk->created_at,
                    'source_id' => $jobDesk->id,
                ];
            });

        $notifications = $messages
            ->concat($jobDesks)
            ->sortByDesc('created_at')
            ->values()
            ->take(20);

        return response()->json([
            'data' => $notifications,
            'unread_count' => $notifications->count(),
        ]);
    }
}
