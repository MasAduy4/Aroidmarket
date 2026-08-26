<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AroidMarketUsdBalance extends Model
{
    protected $fillable = [
        'transaction_date', 'name', 'payment_method', 'total_usd', 'penahanan_usd',
        'admin_fee_usd', 'net_usd', 'withdrawal_usd', 'withdrawal_idr', 'recorded_by',
    ];

    protected function casts(): array
    {
        return [
            'transaction_date' => 'date',
            'total_usd' => 'decimal:2',
            'penahanan_usd' => 'decimal:2',
            'admin_fee_usd' => 'decimal:2',
            'net_usd' => 'decimal:2',
            'withdrawal_usd' => 'decimal:2',
            'withdrawal_idr' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (AroidMarketUsdBalance $balance) {
            // Net = Total - penahanan - potongan admin (terverifikasi dari data sheet asli)
            $total = (float) ($balance->total_usd ?? 0);
            $penahanan = (float) ($balance->penahanan_usd ?? 0);
            $adminFee = (float) ($balance->admin_fee_usd ?? 0);
            $balance->net_usd = $total - $penahanan - $adminFee;
        });
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}