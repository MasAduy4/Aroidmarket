<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlantCategory extends Model
{
    protected $fillable = ['name', 'slug', 'description'];

    public function plants(): HasMany
    {
        return $this->hasMany(Plant::class);
    }
}
