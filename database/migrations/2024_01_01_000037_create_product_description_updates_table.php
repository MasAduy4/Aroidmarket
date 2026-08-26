<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Histori/pelacakan perubahan nama & deskripsi produk di berbagai platform jualan
        Schema::create('product_description_updates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plant_id')->nullable()->constrained('plants')->nullOnDelete();

            $table->string('platform'); // shopify, palmstreet, website, dll
            $table->string('old_name')->nullable();
            $table->string('new_name')->nullable();
            $table->text('old_description')->nullable();
            $table->text('new_description')->nullable();

            $table->foreignId('updated_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_description_updates');
    }
};
