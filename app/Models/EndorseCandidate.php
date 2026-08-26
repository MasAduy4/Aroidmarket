<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EndorseCandidate extends Model
{
    protected $fillable = [
        'name', 'platform', 'social_media_handle', 'followers_count',
        'status', 'contact_info', 'notes', 'assigned_to',
    ];

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
