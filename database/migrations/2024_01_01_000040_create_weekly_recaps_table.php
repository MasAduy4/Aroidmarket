<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Snapshot rekap mingguan lintas modul untuk konsumsi Manager PMS.
        Schema::create('weekly_recaps', function (Blueprint $table) {
            $table->id();
            $table->string('minggu')->nullable();
            $table->decimal('nominal', 15, 2)->default(0);
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();

            $table->json('cs_summary')->nullable();          // ringkasan report CS per kategori
            $table->json('greenhouse_summary')->nullable();   // ringkasan stok masuk/keluar & kondisi tanaman
            $table->json('finance_summary')->nullable();      // ringkasan kas, biaya, penjualan

            $table->text('manager_notes')->nullable();
            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weekly_recaps');
    }
};