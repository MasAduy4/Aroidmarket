<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plant_order_purchases', function (Blueprint $table) {
            $table->decimal('subtotal', 15, 2)->default(0)->after('price_per_unit'); // Subtotal (auto)
            $table->decimal('shipping_cost', 15, 2)->default(0)->after('subtotal'); // Shipping cost
        });
    }

    public function down(): void
    {
        Schema::table('plant_order_purchases', function (Blueprint $table) {
            $table->dropColumn(['subtotal', 'shipping_cost']);
        });
    }
};