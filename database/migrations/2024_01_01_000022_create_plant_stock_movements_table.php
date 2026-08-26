<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Mencatat histori pergerakan stok pcs tanaman: masuk (restock/panen), keluar (terjual/mati)
        Schema::create('plant_stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plant_id')->constrained('plants')->cascadeOnDelete();

            $table->enum('type', ['in', 'out']);
            $table->unsignedInteger('quantity'); // jumlah pcs pada transaksi ini
            $table->string('reason')->nullable(); // contoh: panen baru, terjual, indukan dipindah, tanaman mati

            $table->foreignId('recorded_by')->constrained('users')->cascadeOnDelete();
            $table->date('movement_date');
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plant_stock_movements');
    }
};
