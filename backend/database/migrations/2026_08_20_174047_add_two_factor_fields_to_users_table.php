<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table
                ->boolean('two_factor_enabled')
                ->default(true)
                ->after('role');

            $table
                ->string('two_factor_method')
                ->default('email')
                ->after('two_factor_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'two_factor_enabled',
                'two_factor_method',
            ]);
        });
    }
};
