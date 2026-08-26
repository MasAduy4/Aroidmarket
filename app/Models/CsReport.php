<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class CsReport extends Model
{
    public const STATUS_OPEN = 'open';
    public const STATUS_IN_PROGRESS = 'in-progress';
    public const STATUS_RESOLVED = 'resolved';

    /**
     * Primary key bertipe string (custom ID), bukan auto-increment.
     */
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'order_id',
        'customer',
        'category',
        'description',
        'status',
        'is_escalation',
        'sla_deadline',
    ];

    protected function casts(): array
    {
        return [
            'is_escalation' => 'boolean',
            'sla_deadline' => 'datetime',
        ];
    }

    public function timelines(): HasMany
    {
        return $this->hasMany(CsReportTimeline::class, 'cs_report_id');
    }

    /**
     * Generate ID unik sesuai tipe laporan.
     * Eskalasi : ESC-YYYYMMDD-XXXX  (contoh: ESC-20260812-1024)
     * Rutin    : report-{unix_timestamp}
     */
    public static function generateId(bool $isEscalation): string
    {
        if ($isEscalation) {
            do {
                $candidate = 'ESC-' . now()->format('Ymd') . '-' . str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
            } while (self::whereKey($candidate)->exists());

            return $candidate;
        }

        $candidate = 'report-' . now()->timestamp;

        // Jaga-jaga jika dua request masuk di detik yang sama.
        while (self::whereKey($candidate)->exists()) {
            $candidate = 'report-' . now()->timestamp . '-' . Str::lower(Str::random(3));
        }

        return $candidate;
    }

    /**
     * Hitung sla_deadline otomatis (H+3 hari dari waktu dibuat) untuk laporan eskalasi.
     */
    public static function calculateSlaDeadline(): Carbon
    {
        return now()->addDays(3);
    }

    public function isOverdue(): bool
    {
        return $this->is_escalation
            && $this->status !== self::STATUS_RESOLVED
            && $this->sla_deadline !== null
            && $this->sla_deadline->isPast();
    }
}