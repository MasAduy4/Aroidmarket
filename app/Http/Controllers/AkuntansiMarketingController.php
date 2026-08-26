<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Concerns\ManagesAkuntansiSheets;
use App\Models\WeeklyRecap;
use App\Models\JobDesk;
use App\Models\EndorseCandidate;

class AkuntansiMarketingController extends Controller
{
    use ManagesAkuntansiSheets;

    public function index()
    {
        $weeklyIncome = WeeklyRecap::all();
        $jobdesks = JobDesk::all();
        $endorseList = EndorseCandidate::all();

        // 1. Perhitungan Pendapatan Bulanan (Minggu 1 - 4)
        $weeklyRecaps = WeeklyRecap::where('minggu', 'not like', 'Bulan %')->get();
        $monthlyIncome = (float) $weeklyRecaps->sum(fn ($item) => $item->nominal ?? $item->amount ?? 0);

        // 2. Perhitungan Total Pendapatan Tahun Ini (Jan - Okt)
        $monthsMap = [
            'Jan' => 1, 'Feb' => 2, 'Mar' => 3, 'Apr' => 4, 'Mei' => 5,
            'Jun' => 6, 'Jul' => 7, 'Agu' => 8, 'Sep' => 9, 'Okt' => 10,
        ];
        $monthlyRevenueData = [];

        foreach ($monthsMap as $label => $monthNum) {
            $manualRecap = WeeklyRecap::where('minggu', 'Bulan ' . $label)->first();

            if ($manualRecap) {
                $monthlySum = (float) ($manualRecap->nominal ?? $manualRecap->amount ?? 0);
            } else {
                $monthlySum = (float) WeeklyRecap::where('minggu', 'not like', 'Bulan %')
                    ->whereMonth('created_at', $monthNum)
                    ->get()
                    ->sum(fn ($item) => $item->nominal ?? $item->amount ?? 0);

                if ($monthlySum === 0.0 && $monthNum === (int) date('n')) {
                    $monthlySum = $monthlyIncome;
                }
            }

            $monthlyRevenueData[$label] = $monthlySum;
        }

        $yearlyIncome = array_sum($monthlyRevenueData);

        // 3. Data sheet (Buku Kas, Operasional, dll.) — sumber tunggal dari
        //    trait ManagesAkuntansiSheets, sama persis dengan yang dipakai
        //    ManagerPmsController untuk /manager-dashboard.
        $sheetsData = $this->getAllSheetsData();

        return Inertia::render('AkuntansiMarketingView', [
            'jobdesksProps'  => $jobdesks,
            'endorseProps'   => $endorseList,
            'sheetsProps'    => $sheetsData,
            'financialProps' => [
                'weeklyIncome'       => $weeklyIncome,
                'monthlyIncome'      => $monthlyIncome,
                'yearlyIncome'       => $yearlyIncome,
                'monthlyRevenueData' => $monthlyRevenueData,
                'totalInfluencer'    => $endorseList->count(),
            ],
        ]);
    }

    // --- FITUR 1: OMSET MINGGUAN ---
    public function updateWeeklyIncome(Request $request, $id)
    {
        $recap = WeeklyRecap::findOrFail($id);
        $recap->update(['nominal' => $request->nominal]);
        return back();
    }

    public function storeMonthlyIncome(Request $request)
    {
        $validated = $request->validate([
            'month'   => 'required|string|in:Jan,Feb,Mar,Apr,Mei,Jun,Jul,Agu,Sep,Okt',
            'nominal' => 'required|numeric|min:0',
        ]);

        WeeklyRecap::updateOrCreate(
            ['minggu' => 'Bulan ' . $validated['month']],
            [
                'nominal' => $validated['nominal'],
                'amount'  => $validated['nominal'],
            ]
        );

        return back()->with('success', "Data pendapatan Bulan {$validated['month']} berhasil disimpan.");
    }

    // --- FITUR 2: CHECKLIST JOBDESK ---
    public function storeJobdesk(Request $request)
    {
        $request->validate(['text' => 'required|string']);
        JobDesk::create([
            'text'      => $request->text,
            'category'  => $request->category ?? 'Akuntansi',
            'completed' => false,
        ]);
        return back();
    }

    public function toggleJobdesk($id)
    {
        $job = JobDesk::findOrFail($id);
        $job->update(['completed' => !$job->completed]);
        return back();
    }

    public function destroyJobdesk($id)
    {
        JobDesk::findOrFail($id)->delete();
        return back();
    }

    // --- FITUR 3: MANAJEMEN ENDORSE ---
    public function storeEndorse(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'platform' => 'required|string|max:50',
        ]);

        EndorseCandidate::create([
            'name'                => $request->name,
            'platform'            => $request->platform,
            'social_media_handle' => $request->name,
            'status'              => 'Belum',
        ]);

        return redirect()->back()->with('success', 'Calon endorse berhasil ditambahkan.');
    }

    public function updateEndorse(Request $request, $id)
    {
        $endorse = EndorseCandidate::findOrFail($id);
        $endorse->update([
            'name'     => $request->name ?? $endorse->name,
            'platform' => $request->platform ?? $endorse->platform,
            'status'   => $request->status ?? $endorse->status,
        ]);
        return back();
    }

    public function updateEndorseStatus($id)
    {
        $endorse = EndorseCandidate::findOrFail($id);
        $nextStatus = match ($endorse->status) {
            'Belum'     => 'Dihubungi',
            'Dihubungi' => 'Deal',
            default     => 'Belum',
        };
        $endorse->update(['status' => $nextStatus]);
        return back();
    }

    public function destroyEndorse($id)
    {
        $endorse = EndorseCandidate::find($id);
        if ($endorse) {
            $endorse->delete();
        }
        return back();
    }

    // --- FITUR 4: DYNAMIC SHEET CRUD ---
    // storeSheetRow(), updateSheetRow(), destroySheetRow() sekarang datang
    // dari trait ManagesAkuntansiSheets (satu sumber logic untuk controller ini
    // dan ManagerPmsController).

    // --- FITUR 5: INTEGRASI LAPORAN KE MANAGER PMS ---
    public function sendToPmsManager(Request $request)
    {
        $validated = $request->validate([
            'kategori'         => 'required|string|max:255',
            'total_pendapatan' => 'required|numeric',
        ]);

        return redirect()->back()->with(
            'success',
            'Laporan ' . $validated['kategori'] . ' senilai Rp ' .
            number_format($validated['total_pendapatan'], 0, ',', '.') .
            ' berhasil dikirim ke Manager PMS!'
        );
    }

    public function storeWeeklyIncome(Request $request)
    {
        $validated = $request->validate([
            'minggu'  => 'required|string|in:Minggu ke-1,Minggu ke-2,Minggu ke-3,Minggu ke-4',
            'nominal' => 'required|numeric|min:0',
        ]);

        WeeklyRecap::updateOrCreate(
            ['minggu' => $validated['minggu']],
            [
                'nominal' => $validated['nominal'],
                'amount'  => $validated['nominal'],
            ]
        );

        return back()->with('success', "Data pendapatan {$validated['minggu']} berhasil disimpan.");
    }
}