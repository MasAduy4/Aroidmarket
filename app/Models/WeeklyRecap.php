<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WeeklyRecap extends Model
{
    protected $fillable = [
        'period_start', 
        'period_end', 
        'cs_summary', 
        'greenhouse_summary',
        'finance_summary', 
        'manager_notes', 
        'generated_by',
        'minggu',   // <-- Tambahkan ini
        'nominal',  // <-- Tambahkan ini
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'cs_summary' => 'array',
            'greenhouse_summary' => 'array',
            'finance_summary' => 'array',
        ];
    }

    public function generator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}