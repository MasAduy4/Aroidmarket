<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Buku Kas umum (arus kas masuk/keluar perusahaan)
        Schema::create('cash_books', function (Blueprint $table) {
            $table->id();
            $table->date('transaction_date');
            $table->enum('type', ['in', 'out']); // kas masuk / kas keluar
            $table->string('category'); // contoh: penjualan, operasional, gaji, dll
            $table->decimal('amount', 15, 2);
            $table->text('description')->nullable();
            $table->foreignId('recorded_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['transaction_date', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_books');
    }
};
