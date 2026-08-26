<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shopify_orders', function (Blueprint $table) {
            $table->dropColumn(['shopify_order_id', 'order_date', 'total_amount', 'currency', 'status', 'raw_data']);
        });

        Schema::table('shopify_orders', function (Blueprint $table) {
            $table->string('order_number')->nullable()->after('id'); // Name, contoh: #AM-4447 (berulang per line item)
            $table->dateTime('paid_at')->nullable()->after('order_number'); // Paid at
            $table->decimal('total_usd', 15, 2)->nullable()->after('paid_at'); // Total ($) tingkat order
            $table->unsignedInteger('quantity')->default(1)->after('customer_name'); // Lineitem quantity
            $table->string('item_name')->nullable()->after('quantity'); // Lineitem name
            $table->string('payment_method')->nullable()->after('item_name'); // Payment Method
            $table->string('tags')->nullable()->after('payment_method'); // Tags
            $table->decimal('price_per_unit', 15, 2)->default(0)->after('tags'); // Harga tanaman
            $table->decimal('total_price', 15, 2)->default(0)->after('price_per_unit'); // total tanaman (auto)
            $table->decimal('packing_fee', 15, 2)->default(0)->after('total_price'); // Jasa Packing
            $table->boolean('shipped')->default(false)->after('packing_fee'); // Terkirim (0/1)
            $table->date('ship_date')->nullable()->after('shipped'); // tanggal kirim
        });
    }

    public function down(): void
    {
        Schema::table('shopify_orders', function (Blueprint $table) {
            $table->dropColumn([
                'order_number', 'paid_at', 'total_usd', 'quantity', 'item_name',
                'payment_method', 'tags', 'price_per_unit', 'total_price',
                'packing_fee', 'shipped', 'ship_date',
            ]);
        });

        Schema::table('shopify_orders', function (Blueprint $table) {
            $table->string('shopify_order_id')->unique();
            $table->date('order_date');
            $table->decimal('total_amount', 15, 2);
            $table->string('currency', 10)->default('USD');
            $table->enum('status', ['pending', 'paid', 'fulfilled', 'cancelled', 'refunded'])->default('pending');
            $table->json('raw_data')->nullable();
        });
    }
};