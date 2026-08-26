<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tanaman Baru — pembelian/restock tanaman umum (bukan untuk memenuhi order customer tertentu,
        // itu tercatat di plant_order_purchases). Ini murni penambahan koleksi/stok baru.
        Schema::create('new_plant_purchases', function (Blueprint $table) {
            $table->id();
            $table->date('purchase_date');
            $table->string('plant_name');
            $table->string('category')->nullable();
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('price_per_unit', 15, 2);
            $table->decimal('total_price', 15, 2);
            $table->string('supplier_name')->nullable(); // asal/sumber tanaman
            $table->text('note')->nullable();
            $table->foreignId('recorded_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('new_plant_purchases');
    }
};
