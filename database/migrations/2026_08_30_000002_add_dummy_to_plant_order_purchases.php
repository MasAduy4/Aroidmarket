<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plant_order_purchases', function (Blueprint $table) {
            $table->string('dummy')->nullable()->after('supplier_name');
        });
    }

    public function down(): void
    {
        Schema::table('plant_order_purchases', function (Blueprint $table) {
            $table->dropColumn('dummy');
        });
    }
};
