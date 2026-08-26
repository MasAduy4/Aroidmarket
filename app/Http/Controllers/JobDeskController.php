<?php

namespace App\Http\Controllers;

use App\Models\JobDesk;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class JobDeskController extends Controller
{
    // Menampilkan daftar jobdesk berdasarkan role
    public function index()
    {
        $user = Auth::user();

        // Jika admin atau manager, bisa melihat semua tugas. Jika user biasa, hanya tugas miliknya sendiri.
        if ($user->role === 'admin' || $user->role === 'manager') {
            $jobDesks = JobDesk::with(['user', 'manager'])->latest()->get();
            $users = User::all(); // Untuk pilihan assign tugas ke staff
        } else {
            $jobDesks = JobDesk::with(['user', 'manager'])->where('user_id', $user->id)->latest()->get();
            $users = collect([$user]);
        }

        return Inertia::render('JobDesks/Index', [
            'jobDesks' => $jobDesks,
            'users' => $users
        ]);
    }

    // Menyimpan jobdesk baru
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'target_date' => 'required|date',
        ]);

        JobDesk::create([
            'user_id' => $request->user_id,
            'assigned_by' => Auth::id(),
            'title' => $request->title,
            'description' => $request->description,
            'target_date' => $request->target_date,
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Jobdesk berhasil ditambahkan!');
    }

    // Memperbarui status tugas (misal dari pending jadi completed)
    public function updateStatus(Request $request, JobDesk $jobDesk)
    {
        $request->validate([
            'status' => 'required|string|in:pending,in_progress,completed,validated',
        ]);

        $jobDesk->update([
            'status' => $request->status,
        ]);

        return redirect()->back()->with('success', 'Status jobdesk berhasil diperbarui!');
    }

    // User menandai tugas selesai dikerjakan
    public function complete(JobDesk $jobDesk)
    {
        $jobDesk->update(['status' => 'completed']);
        return redirect()->back()->with('success', 'Jobdesk ditandai selesai.');
    }

    // Manager memvalidasi tugas
    public function validateJob(JobDesk $jobDesk)
    {
        $jobDesk->update(['status' => 'validated']);
        return redirect()->back()->with('success', 'Jobdesk berhasil divalidasi.');
    }

    // Menghapus jobdesk
    public function destroy(JobDesk $jobDesk)
    {
        $jobDesk->delete();
        return redirect()->back()->with('success', 'Jobdesk berhasil dihapus.');
    }
}