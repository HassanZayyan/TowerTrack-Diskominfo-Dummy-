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
        // Create statuses table first
        Schema::create('statuses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('color')->default('#6B7280');
            $table->string('icon')->default('circle');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
        
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tower_id')->constrained('towers')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('reporter_name')->nullable();
            $table->string('reporter_phone')->nullable();
            $table->string('category');
            $table->text('message');
            $table->foreignId('status_id')->nullable()->constrained('statuses')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
        Schema::dropIfExists('statuses');
    }
};
