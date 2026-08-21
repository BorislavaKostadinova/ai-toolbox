<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('category_tool', function (Blueprint $table) {
			$table->foreignId('tool_id')
				->constrained()
				->cascadeOnDelete();

			$table->foreignId('category_id')
				->constrained()
				->cascadeOnDelete();

			$table->primary(['tool_id', 'category_id']);
		});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('category_tool');
    }
	
};
