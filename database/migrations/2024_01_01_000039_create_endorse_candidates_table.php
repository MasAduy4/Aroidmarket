<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Daftar pencarian & tracking calon endorse/influencer
        Schema::create('endorse_candidates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('platform'); // Instagram, TikTok, YouTube, dll
            $table->string('social_media_handle')->nullable();
            $table->unsignedBigInteger('followers_count')->nullable();
            $table->enum('status', [
                'prospecting', 'contacted', 'negotiating', 'agreed', 'rejected', 'collaborated',
            ])->default('prospecting');
            $table->string('contact_info')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('endorse_candidates');
    }
};
