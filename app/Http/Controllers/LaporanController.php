<?php

namespace App\Http\Controllers;

use App\Models\Laporan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LaporanController extends Controller
{
    /**
     * Menampilkan daftar laporan untuk petani / user.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Mengambil riwayat laporan milik user yang sedang login
        $riwayat = Laporan::where('user_id', $user->id)
            ->latest()
            ->get();

        return Inertia::render('User/Index', [
            'user' => $user,
            'riwayat' => $riwayat,
        ]);
    }

    /**
     * Menyimpan laporan harian atau hasil panen baru dari petani.
     */
    public function store(Request $request)
    {
        $input = $request->all();

        // 1. Sanitasi penggantian koma (,) menjadi titik (.) agar terbaca sebagai angka desimal yang valid
        if (isset($input['jumlah_panen_kg'])) {
            $input['jumlah_panen_kg'] = str_replace(',', '.', $input['jumlah_panen_kg']);
        }
        if (isset($input['hasil_panen'])) {
            $input['hasil_panen'] = str_replace(',', '.', $input['hasil_panen']);
        }
        if (isset($input['biaya'])) {
            $input['biaya'] = str_replace(',', '.', $input['biaya']);
        }
        if (isset($input['total_pendapatan'])) {
            $input['total_pendapatan'] = str_replace(',', '.', $input['total_pendapatan']);
        }

        // 2. Validasi input (Menggunakan 'numeric' agar mendukung angka desimal)
        $validated = validator($input, [
            'blok'             => 'required|string|max:255',
            'jenis'            => 'required|string|max:255',
            'tanggal'          => 'required|date',
            'catatan'          => 'required|string',
            'biaya'            => 'nullable|numeric|min:0',
            'total_pendapatan' => 'nullable|numeric|min:0',
            'jumlah_panen_kg'  => 'nullable|numeric|min:0',
            'hasil_panen'      => 'nullable|numeric|min:0',
        ], [
            'blok.required'    => 'Blok / Lokasi Lahan wajib diisi.',
            'catatan.required' => 'Catatan Aktivitas wajib diisi.',
            'tanggal.required' => 'Tanggal laporan wajib diisi.',
            'numeric'          => 'Nilai yang dimasukkan harus berupa angka valid.',
        ])->validate();

        // Penanganan nilai default untuk jumlah panen (mengambil nilai dari hasil_panen atau jumlah_panen_kg)
        $jumlahPanen = $validated['hasil_panen'] ?? $validated['jumlah_panen_kg'] ?? 0;

        // 3. Simpan data laporan ke database
        Laporan::create([
            'user_id'          => $request->user()->id,
            'blok'             => $validated['blok'],
            'jenis'            => $validated['jenis'],
            'tanggal'          => $validated['tanggal'],
            'catatan'          => $validated['catatan'],
            'biaya'            => $validated['biaya'] ?? 0,
            'total_pendapatan' => $validated['total_pendapatan'] ?? 0,
            'jumlah_panen_kg'  => $jumlahPanen,
            'status'           => 'Menunggu Validasi',
        ]);

        return back()->with('message', 'Laporan berhasil dikirim dan menunggu validasi.');
    }
}