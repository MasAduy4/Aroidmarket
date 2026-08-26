<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lahans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade'); // Menghubungkan ke petani/user
            $table->string('petani');
            $table->string('kelompok');
            $table->string('blok');
            $table->decimal('luas', 8, 2);
            $table->string('komoditas');
            $table->enum('status', ['Tervalidasi', 'Menunggu Validasi', 'Ditolak'])->default('Menunggu Validasi');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lahans');
    }
};