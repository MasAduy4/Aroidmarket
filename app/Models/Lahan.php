<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lahan extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'petani',
        'kelompok',
        'blok',
        'luas',
        'komoditas',
        'status',
    ];

    // Relasi Lahan milik User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Satu lahan punya banyak laporan
    public function laporans()
    {
        return $this->hasMany(Laporan::class);
    }
}