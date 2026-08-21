<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tools', function (Blueprint $table) {
            $table
                ->string('status')
                ->default('pending')
                ->after('difficulty');

            $table
                ->foreignId('reviewed_by')
                ->nullable()
                ->after('status')
                ->constrained('users')
                ->nullOnDelete();

            $table
                ->timestamp('reviewed_at')
                ->nullable()
                ->after('reviewed_by');

            $table
                ->text('rejection_reason')
                ->nullable()
                ->after('reviewed_at');

            $table->index('status');
        });

        /*
         * Всички инструменти, създадени преди въвеждането
         * на approval workflow, остават видими.
         */
        DB::table('tools')->update([
            'status' => 'approved',
        ]);
    }

    public function down(): void
    {
        Schema::table('tools', function (Blueprint $table) {
            $table->dropForeign(['reviewed_by']);
            $table->dropIndex(['status']);

            $table->dropColumn([
                'status',
                'reviewed_by',
                'reviewed_at',
                'rejection_reason',
            ]);
        });
    }
};
