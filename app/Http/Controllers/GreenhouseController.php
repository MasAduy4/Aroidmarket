<?php

namespace App\Http\Controllers;

use App\Models\Plant;
use App\Models\PlantCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class GreenhouseController extends Controller
{
    /**
     * Menampilkan daftar tanaman di greenhouse beserta statistik & filter.
     */
    public function index(Request $request)
    {
        // 1. Query Plants dengan pencarian & filter dropdown
        $plants = Plant::with(['category', 'pjGreenhouse'])
            ->when($request->search, function ($query, $search) {
                // Grouping closure agar 'orWhere' tidak merusak kondisi SQL lainnya
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('barcode', 'like', "%{$search}%")
                      ->orWhere('variegation', 'like', "%{$search}%");
                });
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->health_condition, function ($query, $health) {
                $query->where('health_condition', $health);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString(); // Mempertahankan filter/search di URL saat klik pagination

        // 2. Hitung statistik untuk 4 Kartu Ringkasan di Atas
        $stats = [
            'total_plants'    => Plant::sum('stock_qty'),
            'available_count' => Plant::where('status', 'available')->count(),
            'sold_count'      => Plant::where('status', 'sold')->count(),
            'need_attention'  => Plant::where('health_condition', 'tidak_sehat')->count(),
        ];

        // 3. Render ke komponen React Inertia
        return inertia('PjGreenhouse', [
            'plants'     => $plants,
            'categories' => PlantCategory::all(),
            'stats'      => $stats,
            'filters'    => $request->only(['search', 'status', 'health_condition']),
        ]);
    }

    /**
     * Menyimpan data tanaman baru masuk.
     */
    public function store(Request $request)
{
    $validated = $request->validate([
        'plant_category_id'   => 'required|exists:plant_categories,id',
        'name'                => 'required|string|max:255',
        'variegation'         => 'nullable|string|max:255',
        'status'              => 'required|in:available,sold,indukan',
        'health_condition'    => 'required|in:sehat,tidak_sehat',
        'health_note'         => 'nullable|string',
        'stock_qty'           => 'required|integer|min:1',
        'unit_price'          => 'nullable|numeric|min:0',
        'greenhouse_location' => 'nullable|string|max:255',
        'barcodes'            => 'required|array|size:' . $request->input('stock_qty', 1),
        'barcodes.*'          => 'required|string|distinct|unique:plants,barcode',
        'description'         => 'nullable|string',
    ], [
        'barcodes.size'       => 'Jumlah barcode yang di-scan harus sama dengan jumlah stok.',
        'barcodes.*.distinct' => 'Terdapat stiker barcode ganda yang ter-scan di dalam form.',
        'barcodes.*.unique'   => 'Barcode :input sudah terdaftar di sistem greenhouse.',
    ]);

    // Aturan Bisnis: Jika status indukan, harga dikosongkan/null (tidak dijual)
    if ($validated['status'] === 'indukan') {
        $validated['unit_price'] = null;
    }

    // Auto-Split: Simpan setiap pot sebagai 1 record unik di Database
    DB::transaction(function () use ($validated) {
        foreach ($validated['barcodes'] as $barcode) {
            Plant::create([
                'plant_category_id'   => $validated['plant_category_id'],
                'name'                => $validated['name'],
                'variegation'         => $validated['variegation'] ?? null,
                'status'              => $validated['status'],
                'health_condition'    => $validated['health_condition'],
                'health_note'         => $validated['health_note'] ?? null,
                'stock_qty'           => 1, // Setiap pot selalu bernilai 1
                'unit_price'          => $validated['unit_price'],
                'greenhouse_location' => $validated['greenhouse_location'] ?? null,
                'pj_greenhouse_id'    => auth()->id(),
                'barcode'             => $barcode,
                'description'         => $validated['description'] ?? null,
            ]);
        }
    });

    return redirect()->back()->with('success', "Berhasil menambahkan {$validated['stock_qty']} unit tanaman ke greenhouse.");
}

    /**
     * Memperbarui data tanaman secara menyeluruh.
     */
    public function update(Request $request, Plant $plant)
    {
        $validated = $request->validate([
            'plant_category_id'   => 'required|exists:plant_categories,id',
            'name'                => 'required|string|max:255',
            'variegation'         => 'nullable|string|max:255',
            'status'              => 'required|in:available,sold,indukan',
            'health_condition'    => 'required|in:sehat,tidak_sehat',
            'health_note'         => 'nullable|string',
            'stock_qty'           => 'required|integer|min:1',
            'unit_price'          => 'nullable|numeric|min:0',
            'greenhouse_location' => 'nullable|string|max:255',
            'barcode'             => 'nullable|string|max:255|unique:plants,barcode,' . $plant->id,
            'description'         => 'nullable|string',
        ]);

        if ($validated['status'] === 'indukan') {
            $validated['unit_price'] = null;
        }

        $plant->update($validated);

        return redirect()->back()->with('success', 'Data tanaman berhasil diperbarui.');
    }

    /**
     * Menghapus data tanaman dari database.
     */
    public function destroy(Plant $plant)
    {
        $plant->delete();

        return redirect()->back()->with('success', 'Data tanaman berhasil dihapus dari greenhouse.');
    }

    /**
     * Validasi Barcode saat tanaman akan keluar atau dijual.
     */
    public function validateBarcode(Request $request)
    {
        // Hilangkan 'exists' dari validation agar kita bisa menangani respon custom
        $request->validate([
            'barcode' => 'required|string'
        ]);

        $plant = Plant::where('barcode', $request->barcode)->first();

        // Cek 0: Barcode benar-benar tidak ditemukan
        if (!$plant) {
            return response()->json([
                'success' => false,
                'message' => 'Barcode tidak ditemukan di sistem.'
            ], 404);
        }

        // Cek 1: Apakah status indukan? (Tetap kirim 'data' => $plant)
        if ($plant->status === 'indukan') {
            return response()->json([
                'success' => false,
                'message' => 'Gagal! Tanaman ini berstatus INDUKAN dan tidak boleh dijual.',
                'data'    => $plant // <--- TAMBAHKAN INI
            ], 422);
        }

        // Cek 2: Apakah sudah terjual/keluar (sold)? (Tetap kirim 'data' => $plant)
        if ($plant->status === 'sold') {
            return response()->json([
                'success' => false,
                'message' => 'Barcode tidak valid: Tanaman ini sudah berstatus SOLD (terjual).',
                'data'    => $plant // <--- TAMBAHKAN INI
            ], 422);
        }

        // Cek 3: Peringatan kondisi kesehatan hasil tani
        if ($plant->health_condition === 'tidak_sehat') {
            return response()->json([
                'success' => true,
                'warning' => true,
                'message' => 'Peringatan: Tanaman ini terdeteksi TIDAK SEHAT!',
                'data'    => $plant
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Barcode valid! Tanaman siap diproses atau dijual.',
            'data'    => $plant
        ]);
    }

    /**
     * Mengubah status tanaman menjadi SOLD (terjual/keluar dari greenhouse).
     */
    public function markAsSold(Plant $plant)
    {
        if ($plant->status === 'indukan') {
            return redirect()->back()->with('error', 'Tanaman indukan tidak dapat diubah statusnya menjadi sold.');
        }

        $plant->update(['status' => 'sold']);

        return redirect()->back()->with('success', 'Status tanaman berhasil diubah menjadi SOLD.');
    }
}