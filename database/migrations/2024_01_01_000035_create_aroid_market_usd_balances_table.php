<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('aroid_market_usd_balances', function (Blueprint $table) {
            $table->dropColumn(['type', 'amount_usd', 'exchange_rate', 'amount_idr', 'source', 'note', 'transaction_date']);
        });

        Schema::table('aroid_market_usd_balances', function (Blueprint $table) {
            $table->date('transaction_date')->nullable()->after('id'); // tanggal (nullable, ada baris non-tanggal di sheet asli)
            $table->string('name')->nullable()->after('transaction_date'); // Name: no order / Penarikan uang / admin / langganan / refund
            $table->string('payment_method')->nullable()->after('name'); // payment method
            $table->decimal('total_usd', 15, 2)->default(0)->after('payment_method'); // Total
            $table->decimal('penahanan_usd', 15, 2)->default(0)->after('total_usd'); // penahanan (holdback)
            $table->decimal('admin_fee_usd', 15, 2)->default(0)->after('penahanan_usd'); // potongan admin
            $table->decimal('net_usd', 15, 2)->default(0)->after('admin_fee_usd'); // Net (auto)
            $table->decimal('withdrawal_usd', 15, 2)->default(0)->after('net_usd'); // penarikan ($)
            $table->decimal('withdrawal_idr', 15, 2)->default(0)->after('withdrawal_usd'); // nilai penarikan dalam Rupiah
        });
    }

    public function down(): void
    {
        Schema::table('aroid_market_usd_balances', function (Blueprint $table) {
            $table->dropColumn([
                'transaction_date', 'name', 'payment_method', 'total_usd', 'penahanan_usd',
                'admin_fee_usd', 'net_usd', 'withdrawal_usd', 'withdrawal_idr',
            ]);
        });

        Schema::table('aroid_market_usd_balances', function (Blueprint $table) {
            $table->date('transaction_date')->after('id');
            $table->enum('type', ['in', 'out']);
            $table->decimal('amount_usd', 15, 2);
            $table->decimal('exchange_rate', 15, 2);
            $table->decimal('amount_idr', 15, 2);
            $table->string('source')->nullable();
            $table->text('note')->nullable();
        });
    }
};