<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cs_reports', function (Blueprint $table) {
            // Primary key custom-string: 'ESC-20260812-1024' (eskalasi) / 'report-1723456789' (rutin)
            $table->string('id')->primary();

            $table->string('order_id');
            $table->string('customer');
            $table->string('category'); // contoh: resend, refund, pencatatan-pesanan, cancel, dll (bebas/dinamis)
            $table->text('description');

            $table->enum('status', ['open', 'in-progress', 'resolved'])->default('open');

            $table->boolean('is_escalation')->default(false);

            // Diisi otomatis (+3 hari dari created_at) hanya jika is_escalation = true
            $table->timestamp('sla_deadline')->nullable();

            $table->timestamps();

            $table->index(['is_escalation', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cs_reports');
    }
};
