<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipped_orders', function (Blueprint $table) {
            $table->enum('status', ['selamat', 'tidak selamat'])
                ->nullable()
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('shipped_orders', function (Blueprint $table) {
            $table->enum('status', ['dikirim', 'diterima', 'retur'])
                ->nullable()
                ->change();
        });
    }
};
