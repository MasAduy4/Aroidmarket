<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Log/timeline aktivitas per report (histori perubahan status & catatan CS)
        Schema::create('cs_report_timelines', function (Blueprint $table) {
            $table->id();

            // cs_reports.id sekarang string, jadi FK di sini mengikuti tipe string
            $table->string('cs_report_id');
            $table->foreign('cs_report_id')->references('id')->on('cs_reports')->cascadeOnDelete();

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('status_snapshot');
            $table->text('note');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cs_report_timelines');
    }
};
