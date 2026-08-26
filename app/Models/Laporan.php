<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Laporan extends Model
{
    use HasFactory;

    protected $table = 'laporans';

    protected $fillable = [
        'user_id',
        'lahan_id',
        'jenis',
        'tanggal',
        'biaya',
        'jumlah_panen_kg',
        'total_pendapatan',
        'catatan',
        'blok',
        'status',
    ];

    /**
     * Tipe data casting agar desimal tidak dipotong menjadi integer oleh Eloquent.
     */
    protected $casts = [
        'jumlah_panen_kg'  => 'float',
        'biaya'            => 'float',
        'total_pendapatan' => 'float',
        'tanggal'          => 'string',
    ];

    /**
     * Relasi Laporan milik satu User (Petani)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi Laporan terhubung ke satu Lahan (Opsional)
     */
    public function lahan()
    {
        return $this->belongsTo(Lahan::class);
    }
}