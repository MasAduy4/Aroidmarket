<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Rekap penjualan periodik dari Palmstreet Purge (live/promo event)
        Schema::create('palmstreet_purge_recaps', function (Blueprint $table) {
            $table->id();
            $table->string('event_name')->nullable(); // nama sesi purge/live
            $table->date('period_start');
            $table->date('period_end');
            $table->unsignedInteger('total_items_sold')->default(0);
            $table->decimal('total_sales', 15, 2)->default(0);
            $table->decimal('total_fee', 15, 2)->default(0); // fee platform jika ada
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('palmstreet_purge_recaps');
    }
};
