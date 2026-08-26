<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('laporans', function (Blueprint $table) {
            $table->id();
            // Terhubung ke User (Petani)
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Terhubung ke Lahan (Opsional/Nullable jika laporan umum)
            $table->foreignId('lahan_id')->nullable()->constrained('lahans')->onDelete('set null');
            
            $table->string('jenis')->default('Aktivitas Harian'); // Aktivitas Harian / Bahan & Obat / Hasil Panen
            $table->date('tanggal');
            $table->decimal('biaya', 15, 2)->default(0);

            // 🟢 UBAH DARI integer MENJADI decimal(10, 3) 
            // Mendukung presisi hingga 3 angka di belakang koma (contoh: 12.500)
            $table->decimal('jumlah_panen_kg', 10, 3)->default(0);

            $table->decimal('total_pendapatan', 15, 2)->default(0);
            $table->text('catatan')->nullable();
            $table->string('blok')->default('-');
            $table->enum('status', ['Tervalidasi', 'Menunggu Validasi', 'Ditolak'])->default('Menunggu Validasi');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('laporans');
    }
};