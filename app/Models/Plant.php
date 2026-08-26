<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plant extends Model
{
    public const STATUS_AVAILABLE = 'available';
    public const STATUS_SOLD = 'sold';
    public const STATUS_INDUKAN = 'indukan';

    protected $fillable = [
        'barcode', 'plant_category_id', 'name', 'variegation', 'status',
        'health_condition', 'health_note', 'stock_qty', 'unit_price',
        'greenhouse_location', 'pj_greenhouse_id', 'description',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'stock_qty' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(PlantCategory::class, 'plant_category_id');
    }

    public function pjGreenhouse(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pj_greenhouse_id');
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(PlantStockMovement::class);
    }

    public function descriptionUpdates(): HasMany
    {
        return $this->hasMany(ProductDescriptionUpdate::class);
    }

    public function localSales(): HasMany
    {
        return $this->hasMany(LocalSale::class);
    }

    public function isHealthy(): bool
    {
        return $this->health_condition === 'sehat';
    }
}
