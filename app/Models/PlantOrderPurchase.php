<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlantOrderPurchase extends Model
{
    protected $fillable = [
        'purchase_date', 'supplier_name', 'dummy', 'plant_name', 'quantity', 'price_per_unit',
        'subtotal', 'shipping_cost', 'total_price', 'purpose_order_reference',
        'status', 'note', 'recorded_by',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'price_per_unit' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'shipping_cost' => 'decimal:2',
            'total_price' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (PlantOrderPurchase $purchase) {
            $qty = (float) ($purchase->quantity ?? 1);
            $price = (float) ($purchase->price_per_unit ?? 0);
            $purchase->subtotal = $qty * $price;
            $purchase->total_price = $purchase->subtotal + (float) ($purchase->shipping_cost ?? 0);
        });
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}