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
        Schema::create('fo_routes', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Nama jalur FO
            $table->string('slug')->nullable(); // Slug untuk URL friendly name
            $table->string('area')->default('ungaran'); // Area: ungaran atau ambarawa
            $table->text('description')->nullable(); // Deskripsi jalur
            $table->json('path_coordinates'); // Array koordinat jalur dalam format JSON
            $table->string('status')->default('active'); // Status: active, inactive, maintenance
            $table->string('color')->default('#3B82F6'); // Warna jalur untuk display di peta
            $table->decimal('total_distance', 8, 2)->nullable(); // Total jarak dalam kilometer
            $table->integer('total_points')->default(0); // Total titik FO dalam jalur
            $table->json('point_ids')->nullable(); // Array ID points yang terhubung dalam jalur
            $table->json('properties')->nullable(); // Data tambahan dalam format JSON
            $table->timestamps();
            
            // Index untuk performa
            $table->index(['area', 'status']);
            $table->index(['slug']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fo_routes');
    }
};
