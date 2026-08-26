<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lahan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LahanController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('q');

        // Ambil data lahan dari database
        $lahan = Lahan::when($search, function ($query, $search) {
                $query->where('petani', 'like', "%{$search}%")
                      ->orWhere('kelompok', 'like', "%{$search}%")
                      ->orWhere('blok', 'like', "%{$search}%")
                      ->orWhere('komoditas', 'like', "%{$search}%");
            })
            ->latest()
            ->get();

        return Inertia::render('Admin/Lahan', [
            'lahan'  => $lahan,
            'filter' => $request->only('q'),
        ]);
    }

    public function store(Request $request)
    {
        // Validasi inputan dari form tambah lahan
        $data = $request->validate([
            'petani'    => 'required|string|max:100',
            'kelompok'  => 'required|string|max:100',
            'blok'      => 'required|string|max:50',
            'luas'      => 'required|numeric|min:0',
            'komoditas' => 'required|string|max:50',
            'status'    => 'nullable|in:Tervalidasi,Menunggu Validasi,Ditolak',
        ]);

        $data['status'] = $data['status'] ?? 'Menunggu Validasi';

        // Simpan ke database
        Lahan::create($data);

        return redirect()->route('admin.lahan.index')->with('success', 'Lahan berhasil ditambahkan');
    }

    public function update(Request $request, $id)
    {
        $lahan = Lahan::findOrFail($id);
        $lahan->update($request->all());

        return back()->with('success', 'Lahan berhasil diperbarui');
    }

    public function destroy($id)
    {
        Lahan::destroy($id);
        return back()->with('success', 'Lahan berhasil dihapus');
    }
}   