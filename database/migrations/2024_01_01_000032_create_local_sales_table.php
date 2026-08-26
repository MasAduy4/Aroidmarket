<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menyesuaikan local_sales dengan header sheet "Penjualan Lokal":
     * Tgl, Sumber, Inv, nama pembeli, qty, orderan, price, total, modal, keterangan.
     */
    public function up(): void
    {
        Schema::table('local_sales', function (Blueprint $table) {
            $table->dropColumn(['plant_id', 'payment_method']);
        });

        Schema::table('local_sales', function (Blueprint $table) {
            $table->string('source')->nullable()->after('sale_date'); // Sumber
            $table->string('invoice_type')->nullable()->after('source'); // Inv (Orderan / Orang (pemasukan uang))
            $table->string('item_name')->nullable()->after('quantity'); // orderan (nama tanaman)
            $table->decimal('modal', 15, 2)->default(0)->after('total_price'); // modal
        });
    }

    public function down(): void
    {
        Schema::table('local_sales', function (Blueprint $table) {
            $table->dropColumn(['source', 'invoice_type', 'item_name', 'modal']);
        });

        Schema::table('local_sales', function (Blueprint $table) {
            $table->foreignId('plant_id')->nullable()->constrained('plants')->nullOnDelete();
            $table->string('payment_method')->nullable();
        });
    }
};