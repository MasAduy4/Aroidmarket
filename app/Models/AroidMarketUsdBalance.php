<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AroidMarketUsdBalance extends Model
{
    protected $fillable = [
        'transaction_date',
        'name',
        'payment_method',
        'total_usd',
        'penahanan_usd',
        'admin_fee_usd',
        'net_usd',
        'withdrawal_usd',
        'withdrawal_idr',
        'recorded_by',
    ];

    protected function casts(): array
    {
        return [
            'transaction_date' => 'date',
            'total_usd'        => 'decimal:2',
            'penahanan_usd'    => 'decimal:2',
            'admin_fee_usd'    => 'decimal:2',
            'net_usd'          => 'decimal:2',
            'withdrawal_usd'   => 'decimal:2',
            'withdrawal_idr'   => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (AroidMarketUsdBalance $balance) {
            $total = (float) ($balance->total_usd ?? 0);
            $penahanan = (float) ($balance->penahanan_usd ?? 0);
            $adminFee = (float) ($balance->admin_fee_usd ?? 0);

            // Net = Total - Penahanan - Potongan Admin.
            $balance->net_usd = $total - $penahanan - $adminFee;

            // Kebijakan kantor: 1 USD = Rp16.500.
            // Penarikan (Rp) hanya dihitung jika Penarikan ($) diisi.
            if ($balance->withdrawal_usd === null || $balance->withdrawal_usd === '') {
                $balance->withdrawal_idr = null;
            } else {
                $balance->withdrawal_idr = (float) $balance->withdrawal_usd * 16500;
            }
        });
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}