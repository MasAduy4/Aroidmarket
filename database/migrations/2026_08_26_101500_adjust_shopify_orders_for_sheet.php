<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
         * Database saat ini masih menggunakan struktur Shopify lama:
         * shopify_order_id, order_date, total_amount, currency, status
         *
         * Kita ubah menjadi struktur sesuai sheet:
         * Name, Paid at, Total, Lineitem quantity, Lineitem name,
         * Billing Name, Payment Method, Tags, Harga tanaman,
         * total tanaman, Jasa Packing, Terkirim, tanggal kirim.
         */

        Schema::table('shopify_orders', function (Blueprint $table) {
            $oldColumns = [
                'shopify_order_id',
                'order_date',
                'total_amount',
                'currency',
                'status',
                'raw_data',
            ];

            foreach ($oldColumns as $column) {
                if (Schema::hasColumn('shopify_orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('shopify_orders', function (Blueprint $table) {
            // Name
            if (!Schema::hasColumn('shopify_orders', 'order_number')) {
                $table->string('order_number')->nullable()->after('id');
            }

            // Paid at
            if (!Schema::hasColumn('shopify_orders', 'paid_at')) {
                $table->dateTime('paid_at')->nullable()->after('order_number');
            }

            // Total dari spreadsheet: bebas / text
            if (!Schema::hasColumn('shopify_orders', 'total_usd')) {
                $table->text('total_usd')->nullable()->after('paid_at');
            }

            // Lineitem quantity
            if (!Schema::hasColumn('shopify_orders', 'quantity')) {
                $table->unsignedInteger('quantity')->default(1)->after('customer_name');
            }

            // Lineitem name
            if (!Schema::hasColumn('shopify_orders', 'item_name')) {
                $table->string('item_name')->nullable()->after('quantity');
            }

            // Payment Method
            if (!Schema::hasColumn('shopify_orders', 'payment_method')) {
                $table->string('payment_method')->nullable()->after('item_name');
            }

            // Tags - OPTIONAL
            if (!Schema::hasColumn('shopify_orders', 'tags')) {
                $table->string('tags')->nullable()->after('payment_method');
            }

            // Harga tanaman - Rupiah
            if (!Schema::hasColumn('shopify_orders', 'price_per_unit')) {
                $table->decimal('price_per_unit', 15, 2)
                    ->default(0)
                    ->after('tags');
            }

            // Total tanaman - otomatis quantity x price_per_unit
            if (!Schema::hasColumn('shopify_orders', 'total_price')) {
                $table->decimal('total_price', 15, 2)
                    ->default(0)
                    ->after('price_per_unit');
            }

            // Jasa Packing - Rupiah
            if (!Schema::hasColumn('shopify_orders', 'packing_fee')) {
                $table->decimal('packing_fee', 15, 2)
                    ->default(0)
                    ->after('total_price');
            }

            // Terkirim
            if (!Schema::hasColumn('shopify_orders', 'shipped')) {
                $table->boolean('shipped')
                    ->default(false)
                    ->after('packing_fee');
            }

            // Tanggal kirim
            if (!Schema::hasColumn('shopify_orders', 'ship_date')) {
                $table->date('ship_date')
                    ->nullable()
                    ->after('shipped');
            }
        });
    }

    public function down(): void
    {
        Schema::table('shopify_orders', function (Blueprint $table) {
            $newColumns = [
                'order_number',
                'paid_at',
                'total_usd',
                'quantity',
                'item_name',
                'payment_method',
                'tags',
                'price_per_unit',
                'total_price',
                'packing_fee',
                'shipped',
                'ship_date',
            ];

            foreach ($newColumns as $column) {
                if (Schema::hasColumn('shopify_orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('shopify_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('shopify_orders', 'shopify_order_id')) {
                $table->string('shopify_order_id')->nullable();
            }

            if (!Schema::hasColumn('shopify_orders', 'order_date')) {
                $table->date('order_date')->nullable();
            }

            if (!Schema::hasColumn('shopify_orders', 'total_amount')) {
                $table->decimal('total_amount', 15, 2)->nullable();
            }

            if (!Schema::hasColumn('shopify_orders', 'currency')) {
                $table->string('currency', 10)->default('USD');
            }

            if (!Schema::hasColumn('shopify_orders', 'status')) {
                $table->string('status')->nullable();
            }
        });
    }
};