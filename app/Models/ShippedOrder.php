<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShippedOrder extends Model
{
    protected $fillable = [
        'ship_date', 'order_number', 'quantity', 'status', 'courier', 'payment_method',
        'revenue_usd', 'exchange_rate', 'total_plant_value', 'packing_cost',
        'domestic_shipping_cost', 'palmstreet_fee', 'profit_loss', 'note', 'recorded_by',
    ];

    protected function casts(): array
    {
        return [
            'ship_date' => 'date',
            'revenue_usd' => 'decimal:2',
            'exchange_rate' => 'decimal:2',
            'total_plant_value' => 'decimal:2',
            'packing_cost' => 'decimal:2',
            'domestic_shipping_cost' => 'decimal:2',
            'palmstreet_fee' => 'decimal:2',
            'profit_loss' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (ShippedOrder $order) {
            // Kurs default kalau tidak diisi manual (Uang $ AM tidak menyimpan kurs per transaksi).
            if (empty($order->exchange_rate)) {
                $order->exchange_rate = 16000;
            }

            // Laba/Rugi = (Pendapatan USD x kurs) - Total tanaman - Biaya packing - ongkir indo - Biaya PS
            $revenueIdr = (float) ($order->revenue_usd ?? 0) * (float) ($order->exchange_rate ?? 0);
            $costs = (float) ($order->total_plant_value ?? 0)
                + (float) ($order->packing_cost ?? 0)
                + (float) ($order->domestic_shipping_cost ?? 0)
                + (float) ($order->palmstreet_fee ?? 0);

            $order->profit_loss = $revenueIdr - $costs;
        });
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}