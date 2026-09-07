<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('manager_messages', function (Blueprint $table) {
            $table->foreignId('recipient_id')
                ->nullable()
                ->after('user_id')
                ->constrained('users')
                ->nullOnDelete();

            $table->index(['recipient_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('manager_messages', function (Blueprint $table) {
            $table->dropForeign(['recipient_id']);
            $table->dropIndex(['manager_messages_recipient_id_created_at_index']);
            $table->dropColumn('recipient_id');
        });
    }
};
