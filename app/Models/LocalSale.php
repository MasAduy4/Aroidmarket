<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LocalSale extends Model
{
    protected $fillable = [
        'sale_date',
        'source',
        'invoice_type',
        'customer_name',
        'quantity',
        'item_name',
        'price_per_unit',
        'total_price',
        'modal',
        'note',
        'recorded_by',
    ];

    protected function casts(): array
    {
        return [
            'sale_date'      => 'date',
            'price_per_unit' => 'decimal:2',
            'total_price'    => 'decimal:2',
            'modal'          => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (LocalSale $sale) {
            $qty = (float) ($sale->quantity ?? 1);
            $price = (float) ($sale->price_per_unit ?? 0);

            $sale->total_price = $qty * $price;
        });
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}