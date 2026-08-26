<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('new_plant_purchases', function (Blueprint $table) {
            $table->dropColumn(['category', 'quantity', 'price_per_unit']);
        });

        Schema::table('new_plant_purchases', function (Blueprint $table) {
            $table->unsignedInteger('quantity')->nullable()->after('plant_name'); // Qty (nullable: ada baris ongkir/jasa)
            $table->decimal('price_per_unit', 15, 2)->nullable()->after('quantity'); // Price
            $table->decimal('subtotal', 15, 2)->default(0)->after('price_per_unit'); // Subtotal (auto)
            $table->decimal('shipping_cost', 15, 2)->default(0)->after('subtotal'); // Shipping cost
        });
    }

    public function down(): void
    {
        Schema::table('new_plant_purchases', function (Blueprint $table) {
            $table->dropColumn(['quantity', 'price_per_unit', 'subtotal', 'shipping_cost']);
        });

        Schema::table('new_plant_purchases', function (Blueprint $table) {
            $table->string('category')->nullable();
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('price_per_unit', 15, 2);
        });
    }
};