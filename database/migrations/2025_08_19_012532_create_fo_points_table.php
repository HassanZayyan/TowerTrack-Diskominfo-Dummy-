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
        Schema::create('fo_points', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Nama titik FO
            $table->decimal('latitude', 10, 8); // Koordinat latitude
            $table->decimal('longitude', 11, 8); // Koordinat longitude
            $table->string('area')->default('ungaran'); // Area: ungaran atau ambarawa
            $table->text('description')->nullable(); // Deskripsi titik
            $table->string('type')->default('pole'); // Jenis: pole, junction, etc
            $table->string('status')->default('active'); // Status: active, inactive, maintenance
            $table->json('properties')->nullable(); // Data tambahan dalam format JSON
            $table->timestamps();
            
            // Index untuk performa
            $table->index(['area', 'status']);
            $table->index(['latitude', 'longitude']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fo_points');
    }
};
