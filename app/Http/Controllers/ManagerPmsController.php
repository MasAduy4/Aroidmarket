<?php

namespace App\Http\Controllers;

use App\Models\CsReport;
use App\Models\WeeklyRecap;
use App\Models\OperationalCost;
use App\Models\EndorseCandidate;
use App\Models\Lahan;
use App\Models\Plant;
use App\Models\PlantStockMovement;
use App\Models\CashBook;
use App\Models\LocalSale;
use App\Models\ShopifyOrder;
use App\Models\AroidMarketUsdBalance;
use App\Models\PlantOrderPurchase;
use App\Models\ShippedOrder;
use App\Models\NewPlantPurchase;
use App\Http\Controllers\Concerns\ManagesAkuntansiSheets;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ManagerPmsController extends Controller
{
    use ManagesAkuntansiSheets;

    /**
     * Dashboard pemantauan eskalasi dan metrik utama untuk Manager PMS.
     */
    public function index(): Response
    {
        // 1. Data Customer Service — ambil SEMUA report (bukan cuma eskalasi),
        //    karena CustomerServiceView butuh seluruh data untuk tab "cs".
        $csReports = CsReport::latest()->get();
        $escalations = $csReports->where('is_escalation', true)->values();
        $totalLahan = Lahan::count();

        // BUG LAMA: type 'harvest' tidak pernah ada di enum plant_stock_movements
        // (skema aslinya cuma 'in'/'out'). 'in' = stok masuk/panen.
        $totalPanen = (int) PlantStockMovement::where('type', 'in')->sum('quantity');

        // 1b. Data PJ Greenhouse — sumber sama dengan GreenhouseController,
        //     mendukung filter search/status/health_condition dari GreenhouseView.
        $plantQuery = Plant::with('category');

        if ($search = request('search')) {
            $plantQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%")
                  ->orWhere('variegation', 'like', "%{$search}%");
            });
        }
        if ($statusFilter = request('status')) {
            $plantQuery->where('status', $statusFilter);
        }
        if ($healthFilter = request('health_condition')) {
            $plantQuery->where('health_condition', $healthFilter);
        }

        $greenhousePlants = $plantQuery->latest()->get();

        // Angka kartu statistik selalu dihitung dari total keseluruhan,
        // supaya tidak ikut berubah saat sedang difilter.
        $greenhouseStats = [
            'total' => Plant::count(),
            'available' => Plant::where('status', 'available')->count(),
            'sold' => Plant::where('status', 'sold')->count(),
            'perluPerhatian' => Plant::where('health_condition', 'tidak_sehat')->count(),
        ];

        $laporanPanen = PlantStockMovement::with('plant')
            ->where('type', 'in')
            ->latest('movement_date')
            ->take(20)
            ->get();

        $laporanAktivitas = PlantStockMovement::with('plant')
            ->latest('movement_date')
            ->take(30)
            ->get();

        // 2. SINKRONISASI DATA MINGGUAN DARI TABEL WeeklyRecap (Akuntansi & Marketing)
        $weeklyRecaps = WeeklyRecap::all();

        $financeBreakdown = [
            'minggu_ke_1' => 0,
            'minggu_ke_2' => 0,
            'minggu_ke_3' => 0,
            'minggu_ke_4' => 0,
        ];

        if ($weeklyRecaps->isNotEmpty()) {
            foreach ($weeklyRecaps as $index => $recap) {
                $nominalVal = (float) ($recap->nominal ?? $recap->amount ?? 0);
                
                if (!empty($recap->minggu) || !empty($recap->week)) {
                    $weekStr = strtolower($recap->minggu ?? $recap->week);
                    if (str_contains($weekStr, '1')) $financeBreakdown['minggu_ke_1'] = $nominalVal;
                    elseif (str_contains($weekStr, '2')) $financeBreakdown['minggu_ke_2'] = $nominalVal;
                    elseif (str_contains($weekStr, '3')) $financeBreakdown['minggu_ke_3'] = $nominalVal;
                    elseif (str_contains($weekStr, '4')) $financeBreakdown['minggu_ke_4'] = $nominalVal;
                } else {
                    $weekKey = 'minggu_ke_' . ($index + 1);
                    if (array_key_exists($weekKey, $financeBreakdown)) {
                        $financeBreakdown[$weekKey] = $nominalVal;
                    }
                }
            }
        }

        // 3. Kalkulasi Total Pendapatan & Biaya Operasional
        $totalIncome = array_sum($financeBreakdown);
        
        if ($totalIncome === 0 && $weeklyRecaps->isNotEmpty()) {
            $totalIncome = (float) $weeklyRecaps->sum(fn ($item) => $item->nominal ?? $item->amount ?? 0);
        }

        $totalOperationalCost = (float) OperationalCost::sum('subtotal');

        try {
            if (\Illuminate\Support\Facades\Schema::hasColumn('operational_costs', 'nominal')) {
                $totalOperationalCost = (float) OperationalCost::sum('nominal');
            } elseif (\Illuminate\Support\Facades\Schema::hasColumn('operational_costs', 'amount')) {
                $totalOperationalCost = (float) OperationalCost::sum('amount');
            } elseif (\Illuminate\Support\Facades\Schema::hasColumn('operational_costs', 'jumlah')) {
                $totalOperationalCost = (float) OperationalCost::sum('jumlah');
            } elseif (\Illuminate\Support\Facades\Schema::hasColumn('operational_costs', 'total')) {
                $totalOperationalCost = (float) OperationalCost::sum('total');
            }
        } catch (\Exception $e) {
            $totalOperationalCost = 0.0;
        }

        $netProfit = $totalIncome - $totalOperationalCost;

        $financial = [
            'totalIncome' => $totalIncome,
            'totalOperationalCost' => $totalOperationalCost,
            'netProfit' => $netProfit,
        ];

        // 3b. Ringkasan per-sheet Akuntansi & Marketing (kartu tambahan di FinanceView.jsx).
        // Dibungkus try/catch per sheet supaya kalau ada migration yang belum dijalankan,
        // dashboard tetap tampil (kartu itu saja yang menunjukkan 0).
        $sheetSummaries = [
            'bukuKasSaldo' => 0.0,
            'penjualanLokal' => 0.0,
            'dataOrderShopify' => 0.0,
            'uangAmNetUsd' => 0.0,
            'belanjaTanamanOrder' => 0.0,
            'orderanTerkirimLabaRugi' => 0.0,
            'tanamanBaru' => 0.0,
        ];

        try {
            $sheetSummaries['bukuKasSaldo'] = (float) (CashBook::query()->orderByDesc('id')->value('saldo') ?? 0);
        } catch (\Exception $e) {}

        try {
            $sheetSummaries['penjualanLokal'] = (float) LocalSale::sum('total_price');
        } catch (\Exception $e) {}

        try {
            $sheetSummaries['dataOrderShopify'] = (float) ShopifyOrder::sum('total_price');
        } catch (\Exception $e) {}

        try {
            $sheetSummaries['uangAmNetUsd'] = (float) AroidMarketUsdBalance::sum('net_usd');
        } catch (\Exception $e) {}

        try {
            $sheetSummaries['belanjaTanamanOrder'] = (float) PlantOrderPurchase::sum('total_price');
        } catch (\Exception $e) {}

        try {
            $sheetSummaries['orderanTerkirimLabaRugi'] = (float) ShippedOrder::sum('profit_loss');
        } catch (\Exception $e) {}

        try {
            $sheetSummaries['tanamanBaru'] = (float) NewPlantPurchase::sum('total_price');
        } catch (\Exception $e) {}

        $financial['sheetSummaries'] = $sheetSummaries;

        // 4. Hitung Rekap Pendapatan Bulanan (Jan - Okt) untuk Modal Input Grafik
        $monthsMap = ['Jan' => 1, 'Feb' => 2, 'Mar' => 3, 'Apr' => 4, 'Mei' => 5, 'Jun' => 6, 'Jul' => 7, 'Agu' => 8, 'Sep' => 9, 'Okt' => 10];
        $monthlyRevenueData = [];

        foreach ($monthsMap as $label => $monthNum) {
            // Priority 1: Ambil data inputan spesifik ('Bulan Jan', 'Bulan Feb', dst.)
            $manualRecap = WeeklyRecap::where('minggu', 'Bulan ' . $label)->first();

            if ($manualRecap) {
                $monthlySum = (float) ($manualRecap->nominal ?? $manualRecap->amount ?? 0);
            } else {
                // Priority 2: Filter dari data transaksi berdasarkan created_at
                $monthlySum = (float) WeeklyRecap::where('minggu', 'not like', 'Bulan %')
                    ->whereMonth('created_at', $monthNum)
                    ->get()
                    ->sum(fn ($item) => $item->nominal ?? $item->amount ?? 0);

                if ($monthlySum === 0.0 && $monthNum === (int) date('n')) {
                    $monthlySum = $totalIncome;
                }
            }

            $monthlyRevenueData[$label] = $monthlySum;
        }

        // 5. Data Influencer / Endorse Candidate
        $endorseCandidates = EndorseCandidate::latest()->get();

        // 6. Menyusun Objek Stats Utama untuk Dashboard
        $stats = [
            'total' => $escalations->count(),
            'open' => $escalations->where('status', CsReport::STATUS_OPEN)->count(),
            'in_progress' => $escalations->where('status', CsReport::STATUS_IN_PROGRESS)->count(),
            'resolved' => $escalations->where('status', CsReport::STATUS_RESOLVED)->count(),
            'overdue' => $escalations->filter(fn (CsReport $report) => $report->isOverdue())->count(),
            'totalLahan' => $totalLahan,
            'totalPanen' => $totalPanen,
            'totalInfluencer' => $endorseCandidates->count(),
            'finansial' => $financial['netProfit'],
            // dipakai CustomerServiceView jika ingin override hitungan manual
            'totalCsEskalasi' => $csReports->where('is_escalation', true)->count(),
            'totalCsCatatan' => $csReports->where('is_escalation', false)->count(),
        ];

        // 7. Jobdesk dikelompokkan per divisi (dibutuhkan tab Manager PMS / PmsView)
        $jobdesksData = $this->buildJobdesksByDivision();

        // 8. Feed laporan lintas divisi CS + Greenhouse (panel "Pusat Laporan" di PmsView)
        $reportsData = $this->buildCrossDivisionReports($csReports, $laporanAktivitas);

        return Inertia::render('ManagerDashboard', [
            'user' => request()->user(),
            'escalations' => $escalations,
            'stats' => $stats,
            'financial' => $financial,
            'financeBreakdown' => $financeBreakdown,
            'monthlyRevenueData' => $monthlyRevenueData,
            'endorseCandidates' => $endorseCandidates,

            // Dipakai FinanceView.jsx (CRUD sheet: Buku Kas, Operasional, dst.) — sumbernya
            // sama persis dengan yang dipakai AkuntansiMarketingView.jsx (lihat trait ManagesAkuntansiSheets).
            'sheets' => $this->getAllSheetsData(),

            // Tab Customer Service (CustomerServiceView.jsx)
            'customerServiceData' => $csReports,

            // Tab PJ Greenhouse (GreenhouseView.jsx)
            'greenhousePlants' => $greenhousePlants,
            'greenhouseStats' => $greenhouseStats,
            'laporanPanen' => $laporanPanen,
            'laporanAktivitas' => $laporanAktivitas,
            'filters' => [
                'search' => request('search'),
                'status' => request('status'),
                'health_condition' => request('health_condition'),
            ],

            // Tab Manager PMS (PmsView.jsx)
            'jobdeskData' => $jobdesksData,
            'jobdesksData' => $jobdesksData,
            'reportsData' => $reportsData,
        ]);
    }

    /**
     * Kelompokkan JobDesk berdasarkan kategori menjadi bentuk yang dibutuhkan PmsView:
     * { cs: [...], greenhouse: [...], akuntansi: [...], marketing: [...] }
     */
    private function buildJobdesksByDivision(): array
    {
        $grouped = ['cs' => [], 'greenhouse' => [], 'akuntansi' => [], 'marketing' => []];

        if (! class_exists(\App\Models\JobDesk::class)) {
            return $grouped;
        }

        $jobdesks = \App\Models\JobDesk::latest()->get();

        foreach ($jobdesks as $job) {
            $category = strtolower($job->category ?? '');

            $division = match (true) {
                str_contains($category, 'cs') || str_contains($category, 'customer') => 'cs',
                str_contains($category, 'greenhouse') || str_contains($category, 'petani') => 'greenhouse',
                str_contains($category, 'marketing') || str_contains($category, 'endorse') => 'marketing',
                default => 'akuntansi',
            };

            $grouped[$division][] = [
                'id' => $job->id,
                'text' => $job->text,
                'completed' => (bool) $job->completed,
                'isFixed' => true,
            ];
        }

        return $grouped;
    }

    /**
     * Satukan CsReport + aktivitas Greenhouse menjadi satu feed "Laporan Lintas Divisi"
     * dengan bentuk {id, division, date, title, content, status} sesuai kebutuhan PmsView.
     */
    private function buildCrossDivisionReports($csReports, $stockMovements)
    {
        $csFeed = $csReports->map(fn ($r) => [
            'id' => $r->id,
            'division' => 'cs',
            'date' => optional($r->created_at)->format('d M Y'),
            'title' => ucwords(str_replace('-', ' ', $r->category)) . ' — ' . $r->customer,
            'content' => Str::limit($r->description, 120),
            'status' => $r->status === CsReport::STATUS_RESOLVED ? 'Selesai' : 'Proses',
        ]);

        $ghFeed = $stockMovements->map(fn ($m) => [
            'id' => 'gh-' . $m->id,
            'division' => 'greenhouse',
            'date' => optional($m->movement_date)->format('d M Y'),
            'title' => ($m->type === 'in' ? 'Panen Masuk — ' : 'Stok Keluar — ') . ($m->plant->name ?? '-'),
            'content' => $m->reason ?? '-',
            'status' => 'Selesai',
        ]);

        return $csFeed->concat($ghFeed)
            ->sortByDesc('date')
            ->values()
            ->take(30);
    }

    /**
     * API Endpoint: Mengambil detail pendapatan per minggu secara real-time.
     */
    public function getMonthlyRevenue(): JsonResponse
    {
        $weeklyRecaps = WeeklyRecap::all();

        $weeks = [
            ['minggu' => 'Minggu ke-1', 'label' => 'MINGGU KE-1', 'amount' => 0, 'nominal' => 0],
            ['minggu' => 'Minggu ke-2', 'label' => 'MINGGU KE-2', 'amount' => 0, 'nominal' => 0],
            ['minggu' => 'Minggu ke-3', 'label' => 'MINGGU KE-3', 'amount' => 0, 'nominal' => 0],
            ['minggu' => 'Minggu ke-4', 'label' => 'MINGGU KE-4', 'amount' => 0, 'nominal' => 0],
        ];

        foreach ($weeklyRecaps as $index => $recap) {
            $nominalVal = (float) ($recap->nominal ?? $recap->amount ?? 0);
            $weekStr = strtolower($recap->minggu ?? $recap->week ?? '');
            
            if (str_contains($weekStr, '1')) $weeks[0]['nominal'] = $weeks[0]['amount'] = $nominalVal;
            elseif (str_contains($weekStr, '2')) $weeks[1]['nominal'] = $weeks[1]['amount'] = $nominalVal;
            elseif (str_contains($weekStr, '3')) $weeks[2]['nominal'] = $weeks[2]['amount'] = $nominalVal;
            elseif (str_contains($weekStr, '4')) $weeks[3]['nominal'] = $weeks[3]['amount'] = $nominalVal;
            else {
                if (isset($weeks[$index])) {
                    $weeks[$index]['nominal'] = $weeks[$index]['amount'] = $nominalVal;
                }
            }
        }

        $total = array_sum(array_column($weeks, 'nominal'));

        return response()->json([
            'total' => $total,
            'weeks' => $weeks,
        ]);
    }

    /**
     * Simpan data pendapatan bulanan dari modal grafik (Jan - Okt).
     */
    public function storeMonthlyRevenue(Request $request)
    {
        $validated = $request->validate([
            'month' => 'required|string',
            'amount' => 'required|numeric|min:0',
        ]);

        $monthsMap = [
            'Jan' => 1, 'Feb' => 2, 'Mar' => 3, 'Apr' => 4, 'Mei' => 5,
            'Jun' => 6, 'Jul' => 7, 'Agu' => 8, 'Sep' => 9, 'Okt' => 10
        ];

        if (!array_key_exists($validated['month'], $monthsMap)) {
            return redirect()->back()->withErrors(['month' => 'Bulan tidak valid']);
        }

        $monthNum = $monthsMap[$validated['month']];

        // Paksa tahun dan bulan sesuai dengan yang di-input agar konsisten di DB
        $targetDate = now()->setYear((int) date('Y'))->setMonth($monthNum)->setDay(15);

        WeeklyRecap::updateOrCreate(
            ['minggu' => 'Bulan ' . $validated['month']],
            [
                'nominal' => $validated['amount'],
                'amount' => $validated['amount'],
                'created_at' => $targetDate,
                'updated_at' => now(),
            ]
        );

        return redirect()->back()->with('message', 'Data pendapatan bulanan berhasil disimpan!');
    }

    /**
     * API Endpoint: Data poin grafik untuk Overview Performa.
     */
    public function getChartData(Request $request): JsonResponse
    {
        $range = $request->query('range', 'bulan');

        if ($range === 'tahun') {
            $monthlyPenjualan = [];
            $monthsMap = ['Jan' => 1, 'Feb' => 2, 'Mar' => 3, 'Apr' => 4, 'Mei' => 5, 'Jun' => 6, 'Jul' => 7, 'Agu' => 8, 'Sep' => 9, 'Okt' => 10];

            foreach ($monthsMap as $label => $monthNum) {
                $manualRecap = WeeklyRecap::where('minggu', 'Bulan ' . $label)->first();

                if ($manualRecap) {
                    $monthlyPenjualan[] = (float) ($manualRecap->nominal ?? $manualRecap->amount ?? 0);
                } else {
                    $monthlyPenjualan[] = (float) (
                        WeeklyRecap::where('minggu', 'not like', 'Bulan %')
                            ->whereMonth('created_at', $monthNum)
                            ->get()
                            ->sum(fn ($item) => $item->nominal ?? $item->amount ?? 0)
                    );
                }
            }

            return response()->json([
                'labels' => ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'],
                'penjualan' => $monthlyPenjualan,
                'target' => array_fill(0, 10, 316000000), 
                'targetValue' => 316000000,
                'unit' => 'Jt'
            ]);
        }

        $weeklyRecaps = WeeklyRecap::all();
        $weeklyPenjualan = [];

        for ($i = 1; $i <= 4; $i++) {
            $recap = $weeklyRecaps->get($i - 1);
            $weeklyPenjualan[] = $recap ? (float) ($recap->nominal ?? $recap->amount ?? 0) : 0;
        }

        return response()->json([
            'labels' => ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
            'penjualan' => $weeklyPenjualan,
            'target' => array_fill(0, 4, 79000000),
            'targetValue' => 79000000,
            'unit' => 'Jt'
        ]);
    }

    /* -------------------------------------------------------------------------- */
    /*                   CRUD CANDIDATE INFLUENCER / ENDORSE                      */
    /* -------------------------------------------------------------------------- */

    public function getEndorseCandidates(): JsonResponse
    {
        return response()->json(EndorseCandidate::latest()->get());
    }

    public function storeEndorseCandidate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'platform' => 'required|string|in:Instagram,TikTok,YouTube',
            'status' => 'nullable|string',
        ]);

        $validated['status'] = $validated['status'] ?? 'Belum';

        $candidate = EndorseCandidate::create($validated);

        return response()->json([
            'message' => 'Calon influencer berhasil disimpan!',
            'data' => $candidate
        ], 201);
    }

    public function updateEndorseCandidate(Request $request, $id): JsonResponse
    {
        $candidate = EndorseCandidate::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'platform' => 'sometimes|required|string|in:Instagram,TikTok,YouTube',
            'status' => 'sometimes|required|string',
        ]);

        $candidate->update($validated);

        return response()->json([
            'message' => 'Data influencer berhasil diperbarui!',
            'data' => $candidate
        ]);
    }

    public function destroyEndorseCandidate($id): JsonResponse
    {
        $candidate = EndorseCandidate::findOrFail($id);
        $candidate->delete();

        return response()->json([
            'message' => 'Data influencer berhasil dihapus!'
        ]);
    }
}