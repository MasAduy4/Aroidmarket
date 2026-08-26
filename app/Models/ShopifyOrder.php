<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShopifyOrder extends Model
{
    protected $fillable = [
        'order_number', 'paid_at', 'total_usd', 'customer_name', 'quantity', 'item_name',
        'payment_method', 'tags', 'price_per_unit', 'total_price', 'packing_fee',
        'shipped', 'ship_date', 'recorded_by',
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
            'ship_date' => 'date',
            'total_usd' => 'string',
            'price_per_unit' => 'decimal:2',
            'total_price' => 'decimal:2',
            'packing_fee' => 'decimal:2',
            'shipped' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (ShopifyOrder $order) {
            $qty = (float) ($order->quantity ?? 1);
            $price = (float) ($order->price_per_unit ?? 0);
            $order->total_price = $qty * $price;
        });
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}