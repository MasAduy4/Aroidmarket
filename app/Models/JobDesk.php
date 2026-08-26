<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobDesk extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    // Relasi ke User yang menerima tugas
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Relasi ke Manager yang memberikan tugas
    public function manager()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}