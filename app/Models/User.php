<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    public const ROLE_MANAGER_PMS = 'manager_pms';
    public const ROLE_CUSTOMER_SERVICE = 'customer_service';
    public const ROLE_PJ_GREENHOUSE = 'pj_greenhouse';
    public const ROLE_AKUNTANSI_MARKETING = 'akuntansi_marketing';

    protected $fillable = [
        'name', 'email', 'password', 'role', 'phone', 'is_active',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    // ==== Role helpers ====
    public function isManagerPms(): bool
    {
        return $this->role === self::ROLE_MANAGER_PMS;
    }

    public function isCustomerService(): bool
    {
        return $this->role === self::ROLE_CUSTOMER_SERVICE;
    }

    public function isPjGreenhouse(): bool
    {
        return $this->role === self::ROLE_PJ_GREENHOUSE;
    }

    public function isAkuntansiMarketing(): bool
    {
        return $this->role === self::ROLE_AKUNTANSI_MARKETING;
    }

    // ==== Relasi modul CS ====
    public function csReports(): HasMany
    {
        return $this->hasMany(CsReport::class);
    }

    // ==== Relasi modul Greenhouse ====
    public function plants(): HasMany
    {
        return $this->hasMany(Plant::class, 'pj_greenhouse_id');
    }

    public function plantStockMovements(): HasMany
    {
        return $this->hasMany(PlantStockMovement::class, 'recorded_by');
    }

    // ==== Relasi modul Akuntansi & Marketing ====
    public function cashBooks(): HasMany
    {
        return $this->hasMany(CashBook::class, 'recorded_by');
    }

    public function blogPosts(): HasMany
    {
        return $this->hasMany(BlogPost::class, 'author_id');
    }

    public function endorseCandidates(): HasMany
    {
        return $this->hasMany(EndorseCandidate::class, 'assigned_to');
    }
}
