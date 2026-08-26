<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('laporans', function (Blueprint $table) {
            $table->decimal('jumlah_panen_kg', 10, 3)->default(0)->change();
            $table->decimal('biaya', 15, 2)->default(0)->change();
            $table->decimal('total_pendapatan', 15, 2)->default(0)->change();
        });
    }

    public function down(): void
    {
        Schema::table('laporans', function (Blueprint $table) {
            $table->integer('jumlah_panen_kg')->default(0)->change();
        });
    }
};