<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('local_sales', function (Blueprint $table) {
            if (!Schema::hasColumn('local_sales', 'source')) {
                $table->string('source')->nullable()->after('sale_date');
            }

            if (!Schema::hasColumn('local_sales', 'invoice_type')) {
                $table->string('invoice_type')->nullable()->after('source');
            }

            if (!Schema::hasColumn('local_sales', 'item_name')) {
                $table->string('item_name')->nullable()->after('quantity');
            }

            if (!Schema::hasColumn('local_sales', 'modal')) {
                $table->decimal('modal', 15, 2)->nullable()->after('price_per_unit');
            }

            if (!Schema::hasColumn('local_sales', 'note')) {
                $table->text('note')->nullable()->after('modal');
            }
        });
    }

    public function down(): void
    {
        Schema::table('local_sales', function (Blueprint $table) {
            $columns = [
                'source',
                'invoice_type',
                'item_name',
                'modal',
                'note',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('local_sales', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};