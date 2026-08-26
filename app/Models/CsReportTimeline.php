<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CsReportTimeline extends Model
{
    protected $fillable = [
        'cs_report_id', 'created_by', 'status_snapshot', 'note',
    ];

    public function csReport(): BelongsTo
    {
        return $this->belongsTo(CsReport::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
