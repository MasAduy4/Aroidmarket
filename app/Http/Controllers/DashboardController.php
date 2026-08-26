<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Lahan;
use App\Models\Laporan;
use App\Models\Plant;
use App\Models\WeeklyRecap;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        if ($user->role === 'manager') {
            return redirect()->route('manager.dashboard');
        }
        return redirect()->route('user.dashboard');
    }

    public function universal(Request $request)
    {
        $user = $request->user();

        // 1. PASTIKAN DEFAULT SEEDER UNTUK MINGGUAN JIKA KOSONG
        if (class_exists(WeeklyRecap::class)) {
            if (WeeklyRecap::count() === 0 || WeeklyRecap::sum('nominal') == 0) {
                WeeklyRecap::query()->delete();
                $today = now()->format('Y-m-d');
                WeeklyRecap::insert([
                    ['minggu' => 'Minggu ke-1', 'nominal' => 4500000, 'period_start' => $today, 'period_end' => $today, 'created_at' => now(), 'updated_at' => now()],
                    ['minggu' => 'Minggu ke-2', 'nominal' => 4500000, 'period_start' => $today, 'period_end' => $today, 'created_at' => now(), 'updated_at' => now()],
                    ['minggu' => 'Minggu ke-3', 'nominal' => 4800000, 'period_start' => $today, 'period_end' => $today, 'created_at' => now(), 'updated_at' => now()],
                    ['minggu' => 'Minggu ke-4', 'nominal' => 4700000, 'period_start' => $today, 'period_end' => $today, 'created_at' => now(), 'updated_at' => now()],
                ]);
            }
        }

        // Total omset bulanan berjalan = Rp 18.500.000
        $totalOmsetBulanan = class_exists(WeeklyRecap::class) ? floatval(WeeklyRecap::sum('nominal')) : 18500000;

        // 2. DISIAPKAN BREAKDOWN PER MINGGU (BULAN INI)
        $financeBreakdown = [
            'minggu_ke_1' => 0,
            'minggu_ke_2' => 0,
            'minggu_ke_3' => 0,
            'minggu_ke_4' => 0,
        ];

        if (class_exists(WeeklyRecap::class)) {
            $weeklyRecaps = WeeklyRecap::all();
            if ($weeklyRecaps->isNotEmpty()) {
                foreach ($weeklyRecaps as $index => $recap) {
                    $nominalVal = floatval($recap->nominal ?? $recap->amount ?? 0);
                    $weekStr = strtolower($recap->minggu ?? $recap->week ?? '');

                    if (str_contains($weekStr, '1')) {
                        $financeBreakdown['minggu_ke_1'] = $nominalVal;
                    } elseif (str_contains($weekStr, '2')) {
                        $financeBreakdown['minggu_ke_2'] = $nominalVal;
                    } elseif (str_contains($weekStr, '3')) {
                        $financeBreakdown['minggu_ke_3'] = $nominalVal;
                    } elseif (str_contains($weekStr, '4')) {
                        $financeBreakdown['minggu_ke_4'] = $nominalVal;
                    } else {
                        $weekKey = 'minggu_ke_' . ($index + 1);
                        if (array_key_exists($weekKey, $financeBreakdown)) {
                            $financeBreakdown[$weekKey] = $nominalVal;
                        }
                    }
                }
            }
        }

        // 3. AMBIL DATA KEUANGAN BULANAN DARI SESSION (TANPA DIBUTUHKAN MIGRATE / DB BARU)
        $defaultMonthly = [
            'Jan' => 280000000,
            'Feb' => 320000000,
            'Mar' => 310000000,
            'Apr' => 330000000,
            'Mei' => 290000000,
            'Jun' => 340000000,
            'Jul' => 350000000,
            'Agu' => $totalOmsetBulanan,
            'Sep' => 0,
            'Okt' => 0,
        ];

        // Jika session belum pernah diisi, gunakan data default di atas
        $monthlyRevenueData = session('monthly_revenue_data', $defaultMonthly);

        // 4. Data pendukung lainnya
        $totalLahan = class_exists(Lahan::class) ? Lahan::count() : 0;
        $allLaporan = class_exists(Laporan::class) ? Laporan::with('user')->latest()->get() : collect([]);
        $laporanPanen = $allLaporan->filter(fn($item) => str_contains(strtolower($item->jenis ?? ''), 'panen'));
        $laporanAktivitas = $allLaporan->filter(fn($item) => !str_contains(strtolower($item->jenis ?? ''), 'panen'));

        $totalPanenKg = $allLaporan->where('status', 'Tervalidasi')->sum(function ($item) {
            return floatval($item->jumlah_panen_kg ?? $item->hasil_panen ?? 0);
        });

        // 5. Customer Service Data
        $dataCustomerService = [];
        $totalCsEskalasi = 0;
        $totalCsCatatan = 0;

        if (class_exists(\App\Models\CsReport::class)) {
            $allCsReports = \App\Models\CsReport::latest()->get();
            $totalCsEskalasi = $allCsReports->where('is_escalation', true)->count();
            $totalCsCatatan = $allCsReports->where('is_escalation', false)->count();

            $dataCustomerService = $allCsReports->map(function($item) {
                return [
                    'id'            => (string) $item->id,
                    'kategori'      => ucwords(str_replace('_', ' ', $item->category ?? 'Umum')),
                    'order_id'      => $item->order_id ?? '-',
                    'nama_customer' => $item->customer ?? 'Umum',
                    'status'        => $item->status ?? 'open',
                    'description'   => $item->description ?? '-',
                    'is_escalation' => (bool) ($item->is_escalation ?? false),
                    'created_at'    => $item->created_at ? $item->created_at->toISOString() : null,
                ];
            })->values()->toArray();
        }

        // 6. Jobdesk & Greenhouse
        $dataJobdesk = class_exists(\App\Models\JobDesk::class) ? \App\Models\JobDesk::with('user')->latest()->take(10)->get() : [];
        $greenhousePlants = class_exists(Plant::class) ? Plant::with(['category', 'pjGreenhouse'])->latest()->get() : [];
        $greenhouseStats = [
            'total_plants'    => class_exists(Plant::class) ? Plant::sum('stock_qty') : 0,
            'available_count' => class_exists(Plant::class) ? Plant::where('status', 'available')->count() : 0,
            'sold_count'      => class_exists(Plant::class) ? Plant::where('status', 'sold')->count() : 0,
            'need_attention'  => class_exists(Plant::class) ? Plant::where('health_condition', 'tidak_sehat')->count() : 0,
        ];

        $stats = [
            'totalLahan'              => $totalLahan,
            'totalPetani'             => User::where('role', 'user')->count(),
            'totalPanen'              => $totalPanenKg,
            'finansial'               => $totalOmsetBulanan,
            'netProfit'               => $totalOmsetBulanan,
            'net_profit'              => $totalOmsetBulanan,
            'totalPendapatan'         => $totalOmsetBulanan,
            'total_pendapatan'        => $totalOmsetBulanan,
            'totalBiaya'              => 0,
            'total_biaya'             => 0,
            'totalBiayaOperasional'   => 0,
            'total_biaya_operasional' => 0,
            'totalCsTickets'          => count($dataCustomerService),
            'totalCsEskalasi'         => $totalCsEskalasi,
            'totalCsCatatan'          => $totalCsCatatan,
            'pendingJobdesks'         => class_exists(\App\Models\JobDesk::class) ? \App\Models\JobDesk::where('status', '!=', 'Selesai')->count() : 0,
        ];

        return Inertia::render('ManagerDashboard', [
            'user' => [
                'name' => $user->name,
                'role' => $user->role,
            ],
            'stats'                   => $stats,
            'financeBreakdown'        => $financeBreakdown,
            'monthlyRevenueData'      => $monthlyRevenueData, // Sent to React frontend
            'totalPendapatan'         => $totalOmsetBulanan,
            'total_pendapatan'        => $totalOmsetBulanan,
            'totalBiaya'              => 0,
            'total_biaya'             => 0,
            'totalBiayaOperasional'   => 0,
            'total_biaya_operasional' => 0,
            'netProfit'               => $totalOmsetBulanan,
            'net_profit'              => $totalOmsetBulanan,
            'customerServiceData'     => $dataCustomerService,
            'jobdeskData'             => $dataJobdesk,
            'laporanPanen'            => $laporanPanen->take(10)->values(),
            'laporanAktivitas'        => $laporanAktivitas->take(10)->values(),
            'greenhousePlants'        => $greenhousePlants,
            'greenhouseStats'         => $greenhouseStats,
        ]);
    }

    // FUNGSI UPDATE DATA KEUANGAN BULANAN (MENYIMPAN KE SESSION DENGAN AMAN)
    public function updateMonthlyRevenue(Request $request)
    {
        $validated = $request->validate([
            'month'   => 'required|string',
            'nominal' => 'required|numeric|min:0',
        ]);

        $defaultMonthly = [
            'Jan' => 280000000,
            'Feb' => 320000000,
            'Mar' => 310000000,
            'Apr' => 330000000,
            'Mei' => 290000000,
            'Jun' => 340000000,
            'Jul' => 350000000,
            'Agu' => 18500000,
            'Sep' => 0,
            'Okt' => 0,
        ];

        // Ambil data yang ada di session saat ini
        $currentData = session('monthly_revenue_data', $defaultMonthly);

        // Update nominal bulan yang dipilih
        $currentData[$validated['month']] = (float) $validated['nominal'];

        // Simpan kembali ke session
        session(['monthly_revenue_data' => $currentData]);

        return redirect()->back(303)->with('success', 'Data keuangan bulanan berhasil diperbarui!');
    }

    public function admin()
    {
        $totalLahan = class_exists(Lahan::class) ? Lahan::count() : 0;
        $allLaporan = class_exists(Laporan::class) ? Laporan::with('user')->latest()->get() : collect([]);

        $totalPanenKg = $allLaporan->where('status', 'Tervalidasi')->sum(function ($item) {
            return floatval($item->jumlah_panen_kg ?? $item->hasil_panen ?? 0);
        });

        $totalOmsetBulanan = class_exists(WeeklyRecap::class) ? floatval(WeeklyRecap::sum('nominal')) : 18500000;

        $stats = [
            'totalLahan'       => $totalLahan,
            'totalPetani'      => User::where('role', 'user')->count(),
            'totalPanen'       => $totalPanenKg,
            'finansial'        => $totalOmsetBulanan,
            'menungguValidasi' => $allLaporan->where('status', 'Menunggu Validasi')->count(),
        ];

        return Inertia::render('Admin/Index', [
            'stats'          => $stats,
            'laporanTerbaru' => [],
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        if (class_exists(Laporan::class)) {
            $laporan = Laporan::findOrFail($id);
            $laporan->update(['status' => $request->status]);
        }
        return redirect()->back(303);
    }

    public function destroy($id)
    {
        if (class_exists(Laporan::class)) {
            Laporan::findOrFail($id)->delete();
        }
        return redirect()->back(303);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'blok'    => 'required|string',
            'catatan' => 'required|string',
        ]);

        if (class_exists(Laporan::class)) {
            Laporan::create([
                'user_id'          => $request->user()->id,
                'jenis'            => $request->jenis ?? 'Aktivitas Harian',
                'blok'             => $validated['blok'],
                'tanggal'          => $request->tanggal ?? now()->format('Y-m-d'),
                'biaya'            => 0,
                'jumlah_panen_kg'  => floatval($request->jumlah_panen_kg ?? 0),
                'total_pendapatan' => floatval($request->total_pendapatan ?? 0),
                'catatan'          => $validated['catatan'],
                'status'           => 'Menunggu Validasi',
            ]);
        }
        return redirect()->back(303);
    }

    public function user(Request $request)
    {
        $user = $request->user();
        return Inertia::render('User/Index', [
            'user'      => ['name' => $user->name, 'email' => $user->email],
            'lahanSaya' => [],
            'riwayat'   => [],
        ]);
    }
}