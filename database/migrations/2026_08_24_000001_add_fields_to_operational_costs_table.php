<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('operational_costs', function (Blueprint $table) {
            $columnsToDrop = ['cost_name', 'amount', 'description', 'total', 'recorded_by', 'created_at', 'updated_at'];
            foreach ($columnsToDrop as $col) {
                if (Schema::hasColumn('operational_costs', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('operational_costs', function (Blueprint $table) {
            if (!Schema::hasColumn('operational_costs', 'cost_date')) $table->date('cost_date')->nullable();
            if (!Schema::hasColumn('operational_costs', 'supplier')) $table->string('supplier')->nullable();
            if (!Schema::hasColumn('operational_costs', 'item_name')) $table->string('item_name')->nullable();
            if (!Schema::hasColumn('operational_costs', 'category')) $table->string('category')->nullable();
            if (!Schema::hasColumn('operational_costs', 'subcategory')) $table->string('subcategory')->nullable();
            if (!Schema::hasColumn('operational_costs', 'quantity')) $table->integer('quantity')->default(1);
            if (!Schema::hasColumn('operational_costs', 'price')) $table->decimal('price', 15, 2)->default(0);
            if (!Schema::hasColumn('operational_costs', 'subtotal')) $table->decimal('subtotal', 15, 2)->default(0);
            if (!Schema::hasColumn('operational_costs', 'note')) $table->text('note')->nullable();
        });
    }

    public function down(): void
    {
        //
    }
};