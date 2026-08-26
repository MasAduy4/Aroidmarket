<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plants', function (Blueprint $table) {
            $table->id();

            $table->string('barcode')->unique();
            $table->foreignId('plant_category_id')->constrained('plant_categories')->cascadeOnDelete();

            $table->string('name');
            $table->string('variegation')->nullable(); // variegasi/varian khusus tanaman hias

            // Status siklus hidup tanaman di greenhouse
            $table->enum('status', ['available', 'sold', 'indukan'])->default('available');

            // Validasi kondisi kesehatan hasil tani
            $table->enum('health_condition', ['sehat', 'tidak_sehat'])->default('sehat');
            $table->text('health_note')->nullable(); // catatan jika tidak sehat

            $table->unsignedInteger('stock_qty')->default(0); // jumlah pcs saat ini
            $table->decimal('unit_price', 15, 2)->nullable();

            $table->string('greenhouse_location')->nullable(); // lokasi/blok GH
            $table->foreignId('pj_greenhouse_id')->constrained('users')->cascadeOnDelete();

            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['status', 'health_condition']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plants');
    }
};
