<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCsReportRequest;
use App\Http\Requests\UpdateCsReportRequest;
use App\Models\CsReport;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class CustomerServiceController extends Controller
{
    /**
     * Tampilkan halaman CS Desk beserta seluruh data report (terbaru di atas).
     */
    public function index(): Response
    {
        $reports = CsReport::latest()->get();

        return Inertia::render('CustomerService', [
            'reports' => $reports,
        ]);
    }

    /**
     * Simpan report baru (rutin atau eskalasi).
     */
    public function store(StoreCsReportRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $isEscalation = $validated['isEscalation'] ?? false;

        CsReport::create([
            'id' => CsReport::generateId($isEscalation),
            'order_id' => $validated['orderId'],
            'customer' => $validated['customer'],
            'category' => $validated['category'],
            'description' => $validated['description'],
            'status' => CsReport::STATUS_OPEN,
            'is_escalation' => $isEscalation,
            'sla_deadline' => $isEscalation ? CsReport::calculateSlaDeadline() : null,
        ]);

        return redirect()->back()->with('success', 'Report berhasil dibuat.');
    }

    /**
     * Update report (status, customer, orderId, description).
     */
    public function update(UpdateCsReportRequest $request, string $id): RedirectResponse
    {
        $report = CsReport::findOrFail($id);
        $validated = $request->validated();

        $report->update([
            'order_id' => $validated['orderId'] ?? $report->order_id,
            'customer' => $validated['customer'] ?? $report->customer,
            'category' => $validated['category'] ?? $report->category,
            'description' => $validated['description'] ?? $report->description,
            'status' => $validated['status'] ?? $report->status,
        ]);

        return redirect()->back()->with('success', 'Report berhasil diperbarui.');
    }

    /**
     * Hapus report berdasarkan ID.
     */
    public function destroy(string $id): RedirectResponse
    {
        $report = CsReport::findOrFail($id);
        $report->delete();

        return redirect()->back()->with('success', 'Report berhasil dihapus.');
    }
}