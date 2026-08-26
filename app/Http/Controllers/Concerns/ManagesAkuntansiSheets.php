<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\CashBook;
use App\Models\OperationalCost;
use App\Models\LocalSale;
use App\Models\ShopifyOrder;
use App\Models\AroidMarketUsdBalance;
use App\Models\PlantOrderPurchase;
use App\Models\ShippedOrder;
use App\Models\NewPlantPurchase;

trait ManagesAkuntansiSheets
{
    protected function getModelMap()
    {
        return [
            'Buku Kas'              => CashBook::class,
            'Operasional'           => OperationalCost::class,
            'Penjualan Lokal'       => LocalSale::class,
            'Data Order Shopify'    => ShopifyOrder::class,
            'Uang $ Aroid Market'   => AroidMarketUsdBalance::class,
            'Belanja Tanaman Order' => PlantOrderPurchase::class,
            'Orderan Terkirim'      => ShippedOrder::class,
            'Tanaman Baru'          => NewPlantPurchase::class,
        ];
    }

    protected function getAllSheetsData(): array
    {
        $sheetsData = [];

        foreach ($this->getModelMap() as $sheetName => $modelClass) {
            $rows = $modelClass::query()->orderBy('id', 'asc')->get();

            if ($sheetName === 'Buku Kas') {
                $sheetsData[$sheetName] = $this->transformBukuKas($rows);
                continue;
            }

            $formattedRows = $rows->map(fn ($row) => $this->autoFormatRow($row));

            // Kolom audit Operasional tidak boleh sampai ke UI.
            if ($sheetName === 'Operasional') {
                $formattedRows = $formattedRows->map(function ($row) {
                    unset($row['recorded_by'], $row['created_at'], $row['updated_at']);
                    return $row;
                });
            }

            $sheetsData[$sheetName] = $formattedRows->values()->all();
        }

        return $sheetsData;
    }

    private function transformBukuKas($rows): array
    {
        $runningSaldo = 0;
        $transformedRows = [];

        foreach ($rows as $row) {
            $isDebit = ($row->type === 'in' || $row->type === 'debit');
            $debitVal = $isDebit ? (float) $row->amount : 0;
            $kreditVal = !$isDebit ? (float) $row->amount : 0;
            $runningSaldo += ($debitVal - $kreditVal);

            $dateObj = $row->transaction_date ?? $row->created_at;
            $formattedDate = $dateObj
                ? Carbon::parse($dateObj)->translatedFormat('d M Y')
                : '-';

            $transformedRows[] = [
                'id'        => $row->id,
                'Tanggal'   => $formattedDate,
                'Deskripsi' => $row->description ?? '-',
                'Akun'      => $row->category ?? '-',
                'Debit'     => $debitVal > 0 ? 'Rp ' . number_format($debitVal, 0, ',', '.') : '-',
                'Kredit'    => $kreditVal > 0 ? 'Rp ' . number_format($kreditVal, 0, ',', '.') : '-',
                'Saldo'     => 'Rp ' . number_format($runningSaldo, 0, ',', '.'),
            ];
        }

        return $transformedRows;
    }

    private function autoFormatRow($row)
    {
        $data = $row->toArray();

        $usdFields = [
            'penahanan_usd',
            'admin_fee_usd',
            'net_usd',
            'withdrawal_usd',
            'revenue_usd',
        ];

        $datetimeFields = [
            'paid_at',
        ];

        foreach ($data as $key => $value) {
            if ($value === null || $value === '' || $key === 'id') {
                continue;
            }

            $lowerKey = strtolower($key);

            if (in_array($lowerKey, $datetimeFields, true)) {
                try {
                    $data[$key] = Carbon::parse($value)->format('Y-m-d H:i:s');
                } catch (\Throwable $e) {
                    // Pertahankan nilai asli jika gagal diformat.
                }
                continue;
            }

            if (Str::contains($lowerKey, ['date', 'tanggal'])) {
                try {
                    $data[$key] = Carbon::parse($value)->translatedFormat('d M Y');
                } catch (\Throwable $e) {
                    // Pertahankan nilai asli jika gagal diformat.
                }
                continue;
            }

            if (is_numeric($value) && in_array($lowerKey, $usdFields, true)) {
                $data[$key] = '$' . number_format((float) $value, 2, '.', ',');
                continue;
            }

            if (
                is_numeric($value) &&
                Str::contains($lowerKey, [
                    'amount', 'harga', 'price', 'total', 'subtotal', 'nominal', 'saldo',
                    'debit', 'kredit', 'biaya', 'fee', 'idr', 'modal', 'cost',
                ])
            ) {
                $data[$key] = 'Rp ' . number_format((float) $value, 0, ',', '.');
            }
        }

        return $data;
    }

    /**
     * Validasi server-side. Frontend boleh memvalidasi lebih dulu, tetapi backend
     * tetap menjadi penjaga terakhir agar data invalid tidak pernah masuk DB.
     */
    private function validationRules(string $sheetName): array
    {
        return match ($sheetName) {
            'Buku Kas' => [
                'transaction_date' => ['required', 'date_format:Y-m-d'],
                'type'             => ['required', 'in:in,out'],
                'category'         => ['required', 'string', 'max:255'],
                'amount'           => ['required', 'numeric', 'min:0'],
                'description'      => ['nullable', 'string', 'max:5000'],
            ],
            'Operasional' => [
                'cost_date'  => ['required', 'date_format:Y-m-d'],
                'supplier'   => ['required', 'string', 'max:255'],
                'item_name'  => ['required', 'string', 'max:255'],
                'category'   => ['required', 'string', 'max:255'],
                'subcategory'=> ['nullable', 'string', 'max:255'],
                'quantity'   => ['required', 'integer', 'min:1'],
                'price'      => ['required', 'numeric', 'min:0'],
                'note'       => ['nullable', 'string', 'max:5000'],
            ],
            'Penjualan Lokal' => [
                'sale_date'      => ['required', 'date_format:Y-m-d'],
                'source'         => ['required', 'string', 'max:255'],
                'invoice_type'   => ['required', 'string', 'max:255'],
                'customer_name'  => ['required', 'string', 'max:255'],
                'quantity'       => ['required', 'integer', 'min:1'],
                'item_name'      => ['required', 'string', 'max:255'],
                'price_per_unit' => ['required', 'numeric', 'min:0'],
                'modal'          => ['nullable', 'numeric', 'min:0'],
                'note'           => ['nullable', 'string', 'max:5000'],
            ],
            'Data Order Shopify' => [
                'order_number'    => ['required', 'string', 'max:255'],
                'paid_at'         => ['nullable', 'date'],
                // Total pada spreadsheet sengaja berupa teks bebas.
                'total_usd'      => ['nullable', 'string', 'max:255'],
                'customer_name'  => ['nullable', 'string', 'max:255'],
                'quantity'       => ['required', 'integer', 'min:1'],
                'item_name'      => ['required', 'string', 'max:255'],
                'payment_method' => ['nullable', 'string', 'max:255'],
                'tags'           => ['nullable', 'string', 'max:1000'],
                'price_per_unit' => ['required', 'numeric', 'min:0'],
                'packing_fee'    => ['required', 'numeric', 'min:0'],
                'shipped'        => ['required', 'boolean'],
                'ship_date'      => ['nullable', 'date_format:Y-m-d'],
            ],
            'Uang $ Aroid Market' => [
                'transaction_date' => ['nullable', 'date_format:Y-m-d'],
                'name'             => ['nullable', 'string', 'max:255'],
                'payment_method'   => ['nullable', 'string', 'max:255'],
                'total_usd'        => ['nullable', 'numeric', 'min:0'],
                'penahanan_usd'   => ['nullable', 'numeric', 'min:0'],
                'admin_fee_usd'   => ['nullable', 'numeric', 'min:0'],
                'withdrawal_usd'  => ['nullable', 'numeric', 'min:0'],
                'withdrawal_idr'  => ['nullable', 'numeric', 'min:0'],
            ],
            'Belanja Tanaman Order' => [
                'purchase_date'          => ['required', 'date_format:Y-m-d'],
                'supplier_name'          => ['required', 'string', 'max:255'],
                'plant_name'             => ['required', 'string', 'max:255'],
                'quantity'               => ['nullable', 'integer', 'min:1'],
                'price_per_unit'         => ['nullable', 'numeric', 'min:0'],
                'shipping_cost'         => ['nullable', 'numeric', 'min:0'],
                'purpose_order_reference'=> ['nullable', 'string', 'max:1000'],
                'status'                 => ['required', 'in:pending,received,cancelled'],
                'note'                   => ['nullable', 'string', 'max:5000'],
            ],
            'Orderan Terkirim' => [
                'ship_date'              => ['required', 'date_format:Y-m-d'],
                'order_number'           => ['required', 'string', 'max:255'],
                'quantity'               => ['required', 'integer', 'min:1'],
                'status'                 => ['required', 'in:selamat,tidak selamat'],
                'courier'                => ['required', 'string', 'max:255'],
                'payment_method'        => ['required', 'string', 'max:255'],
                'revenue_usd'            => ['required', 'numeric', 'min:0'],
                'exchange_rate'          => ['required', 'numeric', 'min:0'],
                'total_plant_value'      => ['required', 'numeric', 'min:0'],
                'packing_cost'           => ['nullable', 'numeric', 'min:0'],
                'domestic_shipping_cost' => ['nullable', 'numeric', 'min:0'],
                'palmstreet_fee'         => ['nullable', 'numeric', 'min:0'],
                'note'                   => ['nullable', 'string', 'max:5000'],
            ],
            'Tanaman Baru' => [
                'purchase_date'  => ['required', 'date_format:Y-m-d'],
                'plant_name'     => ['required', 'string', 'max:255'],
                'quantity'       => ['nullable', 'integer', 'min:1'],
                'price_per_unit' => ['nullable', 'numeric', 'min:0'],
                'shipping_cost' => ['nullable', 'numeric', 'min:0'],
                'supplier_name' => ['required', 'string', 'max:255'],
                'note'          => ['nullable', 'string', 'max:5000'],
            ],
            default => [],
        };
    }

    private function normalizeInputForSheet(string $sheetName, array $input, array $fillable): array
    {
        // Buku Kas: UI menggunakan Tanggal/Deskripsi/Akun/Debit/Kredit,
        // database menggunakan transaction_date/description/category/type/amount.
        if ($sheetName === 'Buku Kas') {
            // Frontend dapat mengirim dua bentuk:
            // 1) Bentuk tampilan: Debit/Kredit
            // 2) Bentuk database: amount + type
            $rawDebit = $input['Debit'] ?? $input['debit'] ?? null;
            $rawKredit = $input['Kredit'] ?? $input['kredit'] ?? null;
            $rawAmount = $input['amount'] ?? null;
            $rawType = strtolower(trim((string) ($input['type'] ?? '')));

            $debit = $this->normalizeNumber($rawDebit);
            $kredit = $this->normalizeNumber($rawKredit);
            $amountFromPayload = $this->normalizeNumber($rawAmount);

            // Jika frontend mengirim amount + type, gunakan langsung.
            if ($amountFromPayload > 0 && in_array($rawType, ['in', 'out'], true)) {
                $amount = $amountFromPayload;
                $type = $rawType;
            } else {
                // Jika frontend mengirim Debit/Kredit, tentukan type berdasarkan sisi yang terisi.
                if ($debit > 0 && $kredit > 0) {
                    abort(422, 'Buku Kas tidak boleh memiliki Debit dan Kredit sekaligus.');
                }

                $amount = $debit > 0 ? $debit : $kredit;
                $type = $debit > 0 ? 'in' : 'out';
            }

            if ($amount <= 0) {
                abort(422, 'Nominal Buku Kas wajib lebih besar dari 0.');
            }

            $data = [
                'transaction_date' => $this->normalizeDateValue($input['Tanggal'] ?? $input['transaction_date'] ?? null),
                'description'      => trim((string) ($input['Deskripsi'] ?? $input['description'] ?? '')),
                'category'         => trim((string) ($input['Akun'] ?? $input['category'] ?? '')),
                'type'             => $type,
                'amount'           => $amount,
            ];

            return $data;
        }

        $calculatedFields = [
            'subtotal',
            'total_price',
            'total',
            'net_usd',
            'profit_loss',
            'saldo',
        ];

        $data = [];
        foreach ($input as $key => $value) {
            if (!in_array($key, $fillable, true) || in_array(strtolower($key), $calculatedFields, true)) {
                continue;
            }

            if ($sheetName === 'Data Order Shopify' && strtolower($key) === 'total_usd') {
                $data[$key] = $value === null ? null : trim((string) $value);
                continue;
            }

            if ($this->looksLikeDatetimeField($key)) {
                $data[$key] = $this->normalizeDatetimeValue($value);
                continue;
            }

            if ($this->looksLikeDateField($key)) {
                $data[$key] = $this->normalizeDateValue($value);
                continue;
            }

            if ($this->looksLikeNumericField($key)) {
                if ($value === '' || $value === null) {
                    $data[$key] = null;
                } else {
                    $data[$key] = $this->normalizeNumber($value);
                }
                continue;
            }

            $data[$key] = is_string($value) ? trim($value) : $value;
        }

        return $data;
    }

    private function normalizeNumber($value): float
    {
        if (is_int($value) || is_float($value)) {
            if (!is_finite((float) $value)) {
                abort(422, 'Nilai angka tidak valid.');
            }

            return (float) $value;
        }

        $value = trim((string) $value);

        if ($value === '') {
            abort(422, 'Nilai angka tidak boleh kosong.');
        }

        $value = preg_replace('/^\s*(Rp|\$)\s*/iu', '', $value);
        $value = str_replace([' ', "\u{00A0}"], '', $value);

        if ($value === '' || !preg_match('/^-?[0-9][0-9.,]*$/', $value)) {
            abort(422, 'Nilai angka tidak valid.');
        }

        $hasComma = str_contains($value, ',');
        $dotCount = substr_count($value, '.');

        if ($hasComma && $dotCount > 0) {
            // Support both Indonesian 1.250.000,50 and US 1,250,000.50.
            if (preg_match('/^-?\d{1,3}(,\d{3})+\.\d+$/', $value)) {
                $value = str_replace(',', '', $value);
            } elseif (preg_match('/^-?\d{1,3}(\.\d{3})+,\d+$/', $value)) {
                $value = str_replace('.', '', $value);
                $value = str_replace(',', '.', $value);
            } else {
                abort(422, 'Format angka tidak valid.');
            }
        } elseif ($hasComma) {
            // 120,50 -> 120.50 or 1,250 -> 1250.
            if (!preg_match('/^-?\d+,\d+$/', $value) && !preg_match('/^-?\d{1,3}(,\d{3})+$/', $value)) {
                abort(422, 'Format angka tidak valid.');
            }

            if (preg_match('/^-?\d{1,3}(,\d{3})+$/', $value)) {
                $value = str_replace(',', '', $value);
            } else {
                $value = str_replace(',', '.', $value);
            }
        } elseif ($dotCount > 1) {
            // 1.250.000 -> 1250000
            if (!preg_match('/^-?\d{1,3}(\.\d{3})+$/', $value)) {
                abort(422, 'Format angka tidak valid.');
            }

            $value = str_replace('.', '', $value);
        } elseif ($dotCount === 1) {
            // 1.250 = ribuan; 120.50 = decimal.
            [$whole, $fraction] = explode('.', $value, 2);

            if (strlen($fraction) === 3 && strlen(ltrim($whole, '-')) <= 3) {
                $value = $whole . $fraction;
            }
        }

        if (!is_numeric($value) || !is_finite((float) $value)) {
            abort(422, 'Nilai angka tidak valid.');
        }

        return (float) $value;
    }

    private function normalizeDateValue($value): string
    {
        if ($value === null || trim((string) $value) === '') {
            return '';
        }

        try {
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Throwable $e) {
            abort(422, 'Format tanggal tidak valid. Gunakan YYYY-MM-DD.');
        }
    }

    private function normalizeDatetimeValue($value): string
    {
        if ($value === null || trim((string) $value) === '') {
            return '';
        }

        try {
            return Carbon::parse($value)->format('Y-m-d H:i:s');
        } catch (\Throwable $e) {
            abort(422, 'Format tanggal dan waktu tidak valid.');
        }
    }

    private function looksLikeDatetimeField(string $field): bool
    {
        return in_array(strtolower($field), ['paid_at'], true);
    }

    private function looksLikeDateField(string $field): bool
    {
        $lower = strtolower($field);

        return Str::contains($lower, ['date', 'tanggal'])
            && !$this->looksLikeDatetimeField($lower);
    }

    private function looksLikeNumericField(string $field): bool
    {
        $lower = strtolower($field);
        return Str::contains($lower, [
            'amount', 'price', 'harga', 'quantity', 'qty', 'subtotal', 'total',
            'nominal', 'saldo', 'debit', 'kredit', 'fee', 'usd', 'idr', 'cost',
            'revenue', 'modal', 'rate',
        ]);
    }

    private function buildSafeData(array $input, array $fillable, string $table): array
    {
        $existingColumns = Schema::getColumnListing($table);
        $safe = [];
        $skipped = [];

        foreach ($input as $key => $value) {
            if (!in_array($key, $fillable, true)) {
                continue;
            }

            if (!in_array($key, $existingColumns, true)) {
                $skipped[] = $key;
                continue;
            }

            $safe[$key] = $value;
        }

        return ['data' => $safe, 'skipped' => $skipped];
    }

    public function storeSheetRow(Request $request, $sheetName)
    {
        $map = $this->getModelMap();

        if (!isset($map[$sheetName]) || !class_exists($map[$sheetName])) {
            return back()->with('error', "Sheet '{$sheetName}' tidak dikenali.");
        }

        $modelClass = $map[$sheetName];
        $instance = new $modelClass();
        $fillable = $instance->getFillable();
        $input = $request->except(['id', '_token']);

        $data = $this->normalizeInputForSheet($sheetName, $input, $fillable);
        $rules = $this->validationRules($sheetName);

        if (!empty($rules)) {
            $data = validator($data, $rules)->validate();
        }

        if ($sheetName === 'Uang $ Aroid Market') {
            $hasMeaningfulValue = false;
            foreach ([
                'name', 'payment_method', 'total_usd', 'penahanan_usd',
                'admin_fee_usd', 'withdrawal_usd', 'withdrawal_idr',
            ] as $field) {
                $value = $data[$field] ?? null;
                if ($value !== null && $value !== '') {
                    $hasMeaningfulValue = true;
                    break;
                }
            }

            if (!$hasMeaningfulValue) {
                return back()->with('error', 'Data Uang $ Aroid Market tidak boleh kosong.');
            }
        }

        if (in_array('recorded_by', $fillable, true)) {
            $data['recorded_by'] = $request->user()?->id;
        }

        $result = $this->buildSafeData($data, $fillable, $instance->getTable());

        if (empty($result['data'])) {
            return back()->with('error', "Tidak ada kolom yang cocok untuk sheet '{$sheetName}'.");
        }

        $modelClass::create($result['data']);

        return back()->with('success', "Data {$sheetName} berhasil ditambahkan.");
    }

    public function updateSheetRow(Request $request, $sheetName, $id)
    {
        $map = $this->getModelMap();

        if (!isset($map[$sheetName]) || !class_exists($map[$sheetName])) {
            return back()->with('error', "Sheet '{$sheetName}' tidak dikenali.");
        }

        $modelClass = $map[$sheetName];
        $row = $modelClass::findOrFail($id);
        $fillable = $row->getFillable();
        $input = $request->except(['id', '_token']);

        $data = $this->normalizeInputForSheet($sheetName, $input, $fillable);
        $rules = $this->validationRules($sheetName);

        if (!empty($rules)) {
            $data = validator($data, $rules)->validate();
        }

        if ($sheetName === 'Uang $ Aroid Market') {
            $hasMeaningfulValue = false;
            foreach ([
                'name', 'payment_method', 'total_usd', 'penahanan_usd',
                'admin_fee_usd', 'withdrawal_usd', 'withdrawal_idr',
            ] as $field) {
                $value = $data[$field] ?? null;
                if ($value !== null && $value !== '') {
                    $hasMeaningfulValue = true;
                    break;
                }
            }

            if (!$hasMeaningfulValue) {
                return back()->with('error', 'Data Uang $ Aroid Market tidak boleh kosong.');
            }
        }

        $result = $this->buildSafeData($data, $fillable, $row->getTable());

        if (empty($result['data'])) {
            return back()->with('error', "Tidak ada kolom yang cocok untuk sheet '{$sheetName}'.");
        }

        $row->update($result['data']);

        return back()->with('success', "Data {$sheetName} berhasil diperbarui.");
    }

    public function destroySheetRow($sheetName, $id)
    {
        $map = $this->getModelMap();

        if (!isset($map[$sheetName]) || !class_exists($map[$sheetName])) {
            return back()->with('error', "Sheet '{$sheetName}' tidak dikenali.");
        }

        $map[$sheetName]::findOrFail($id)->delete();

        return back()->with('success', "Data {$sheetName} berhasil dihapus.");
    }
}