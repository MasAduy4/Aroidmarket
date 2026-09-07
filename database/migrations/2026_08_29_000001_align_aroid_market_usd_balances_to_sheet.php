<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('aroid_market_usd_balances', function (Blueprint $table) {
            $table->dropColumn([
                'type',
                'amount_usd',
                'exchange_rate',
                'amount_idr',
                'source',
                'note',
            ]);
        });

        Schema::table('aroid_market_usd_balances', function (Blueprint $table) {
            $table->date('transaction_date')->nullable()->change();
            $table->string('name')->nullable()->after('transaction_date');
            $table->string('payment_method')->nullable()->after('name');
            $table->decimal('total_usd', 15, 2)->nullable()->after('payment_method');
            $table->decimal('penahanan_usd', 15, 2)->nullable()->after('total_usd');
            $table->decimal('admin_fee_usd', 15, 2)->nullable()->after('penahanan_usd');
            $table->decimal('net_usd', 15, 2)->nullable()->after('admin_fee_usd');
            $table->decimal('withdrawal_usd', 15, 2)->nullable()->after('net_usd');
            $table->decimal('withdrawal_idr', 18, 2)->nullable()->after('withdrawal_usd');
        });
    }

    public function down(): void
    {
        Schema::table('aroid_market_usd_balances', function (Blueprint $table) {
            $table->dropColumn([
                'name',
                'payment_method',
                'total_usd',
                'penahanan_usd',
                'admin_fee_usd',
                'net_usd',
                'withdrawal_usd',
                'withdrawal_idr',
            ]);
        });

        Schema::table('aroid_market_usd_balances', function (Blueprint $table) {
            $table->enum('type', ['in', 'out']);
            $table->decimal('amount_usd', 15, 2);
            $table->decimal('exchange_rate', 15, 2);
            $table->decimal('amount_idr', 15, 2);
            $table->string('source')->nullable();
            $table->text('note')->nullable();
        });
    }
};
