<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipped_orders', function (Blueprint $table) {
            // customer_name is a legacy column not used by the Orderan Terkirim UI.
            // Keep the column, but allow it to be empty so CRUD can use the
            // spreadsheet fields without forcing a hidden value.
            $table->string('customer_name')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('shipped_orders', function (Blueprint $table) {
            $table->string('customer_name')->nullable(false)->change();
        });
    }
};
