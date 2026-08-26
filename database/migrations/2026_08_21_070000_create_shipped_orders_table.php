<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menyesuaikan struktur shipped_orders agar sama dengan header sheet
     * "Orderan Terkirim" (Data Orderan tanaman yang terkirim) di spreadsheet:
     * No order, Jumlah tanaman, Tanggal kirim, Status paket, Metode KIRIM,
     * Metode payment, Pendapatan ($), Total tanaman (Rp), Biaya packing,
     * ongkir indo, Biaya PS, Laba/Rugi.
     */
    public function up(): void
    {
        Schema::table('shipped_orders', function (Blueprint $table) {
            $table->dropColumn(['channel', 'customer_name', 'plant_name', 'tracking_number', 'shipping_cost', 'status']);
        });

        Schema::table('shipped_orders', function (Blueprint $table) {
            $table->string('order_number')->nullable()->after('ship_date'); // No order, contoh: #AM-5312
            $table->unsignedInteger('quantity')->default(1)->after('order_number'); // Jumlah tanaman
            $table->enum('status', ['selamat', 'tidak selamat'])->default('selamat')->after('quantity'); // Status paket
            $table->string('payment_method')->nullable()->after('courier'); // Metode payment
            $table->decimal('revenue_usd', 15, 2)->default(0)->after('payment_method'); // Pendapatan ($)
            $table->decimal('exchange_rate', 15, 2)->default(16000)->after('revenue_usd'); // kurs saat transaksi
            $table->decimal('total_plant_value', 15, 2)->default(0)->after('exchange_rate'); // Total tanaman (Rp)
            $table->decimal('packing_cost', 15, 2)->default(0)->after('total_plant_value'); // Biaya packing
            $table->decimal('domestic_shipping_cost', 15, 2)->default(0)->after('packing_cost'); // ongkir indo
            $table->decimal('palmstreet_fee', 15, 2)->default(0)->after('domestic_shipping_cost'); // Biaya PS
            $table->decimal('profit_loss', 15, 2)->default(0)->after('palmstreet_fee'); // Laba/Rugi — dihitung otomatis
        });
    }

    public function down(): void
    {
        Schema::table('shipped_orders', function (Blueprint $table) {
            $table->dropColumn([
                'order_number', 'quantity', 'status', 'payment_method', 'revenue_usd',
                'exchange_rate', 'total_plant_value', 'packing_cost',
                'domestic_shipping_cost', 'palmstreet_fee', 'profit_loss',
            ]);
        });

        Schema::table('shipped_orders', function (Blueprint $table) {
            $table->enum('channel', ['shopify', 'palmstreet', 'lokal', 'lainnya'])->default('shopify');
            $table->string('customer_name');
            $table->string('plant_name')->nullable();
            $table->string('tracking_number')->nullable();
            $table->decimal('shipping_cost', 15, 2)->default(0);
            $table->enum('status', ['dikirim', 'diterima', 'retur'])->default('dikirim');
        });
    }
};
