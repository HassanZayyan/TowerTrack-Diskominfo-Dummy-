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
        Schema::create('report_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('reports')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('message');
            $table->string('image_path')->nullable();
            $table->string('file_type')->default('image')->nullable();
            $table->timestamps();
        });
        
        // Create pivot table for report responses and statuses
        Schema::create('report_response_status', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_response_id')->constrained()->onDelete('cascade');
            $table->foreignId('status_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['report_response_id', 'status_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_response_status');
        Schema::dropIfExists('report_responses');
    }
};
