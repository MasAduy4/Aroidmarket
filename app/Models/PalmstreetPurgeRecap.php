<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PalmstreetPurgeRecap extends Model
{
    protected $fillable = [
        'event_name', 'period_start', 'period_end', 'total_items_sold',
        'total_sales', 'total_fee', 'notes', 'recorded_by',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'total_sales' => 'decimal:2',
            'total_fee' => 'decimal:2',
        ];
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
