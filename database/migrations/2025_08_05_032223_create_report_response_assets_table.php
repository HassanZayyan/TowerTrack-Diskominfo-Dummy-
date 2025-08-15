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
        Schema::create('report_response_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_response_id')->constrained('report_responses')->onDelete('cascade');
            $table->string('file_path');
            $table->string('file_name');
            $table->string('file_type'); // image or video
            $table->string('mime_type');
            $table->bigInteger('file_size');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_response_assets');
    }
};
