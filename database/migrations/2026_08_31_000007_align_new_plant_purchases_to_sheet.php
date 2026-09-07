<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('new_plant_purchases', function (Blueprint $table) {
            if (!Schema::hasColumn('new_plant_purchases', 'subtotal')) {
                $table->decimal('subtotal', 15, 2)
                    ->nullable()
                    ->after('price_per_unit');
            }

            if (!Schema::hasColumn('new_plant_purchases', 'shipping_cost')) {
                $table->decimal('shipping_cost', 15, 2)
                    ->nullable()
                    ->after('subtotal');
            }
        });
    }

    public function down(): void
    {
        Schema::table('new_plant_purchases', function (Blueprint $table) {
            if (Schema::hasColumn('new_plant_purchases', 'shipping_cost')) {
                $table->dropColumn('shipping_cost');
            }

            if (Schema::hasColumn('new_plant_purchases', 'subtotal')) {
                $table->dropColumn('subtotal');
            }
        });
    }
};
