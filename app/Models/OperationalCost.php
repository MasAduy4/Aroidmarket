<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OperationalCost extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'cost_date',
        'supplier',
        'item_name',
        'category',
        'subcategory',
        'quantity',
        'price',
        'subtotal',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'cost_date' => 'date',
            'price'     => 'decimal:2',
            'subtotal'  => 'decimal:2',
        ];
    }

    // Helper untuk membersihkan format angka string (Rp, titik, koma)
    public static function sanitizeNumber($value): float
    {
        if (is_null($value) || $value === '') return 0.0;
        if (is_numeric($value)) return (float) $value;

        // Hapus 'Rp', spasi, titik ribuan/koma
        $cleaned = preg_replace('/[^0-9\.]/', '', str_replace(',', '.', str_replace(['Rp', ' ', 'rp'], '', (string)$value)));
        
        // Jika format 90.000 (titik sebagai ribuan), sesuaikan menjadi 90000
        if (substr_count($cleaned, '.') > 1) {
            $cleaned = str_replace('.', '', $cleaned);
        } elseif (preg_match('/^\d{1,3}(\.\d{3})+$/', $cleaned)) {
            $cleaned = str_replace('.', '', $cleaned);
        }

        return (float) $cleaned;
    }

    public function setPriceAttribute($value): void
    {
        $this->attributes['price'] = static::sanitizeNumber($value);
    }

    public function setQuantityAttribute($value): void
    {
        $this->attributes['quantity'] = (int) static::sanitizeNumber($value);
    }

    protected static function booted(): void
    {
        static::saving(function (OperationalCost $cost) {
            $qty = (float) static::sanitizeNumber($cost->quantity ?? 1);
            $price = (float) static::sanitizeNumber($cost->price ?? 0);
            
            $cost->quantity = $qty > 0 ? $qty : 1;
            $cost->price = $price;
            $cost->subtotal = $qty * $price;
        });
    }
}