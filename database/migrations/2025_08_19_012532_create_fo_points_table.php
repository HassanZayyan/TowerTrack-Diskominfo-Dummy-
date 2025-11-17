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
            $table->integer('sequence_number')->nullable(); // Nomor urut dari CSV
            $table->string('name'); // Nama lokasi dari CSV
            $table->decimal('latitude', 12, 8); // Koordinat latitude
            $table->decimal('longitude', 12, 8); // Koordinat longitude
            $table->string('original_coordinates')->nullable(); // Format asli koordinat dari CSV
            $table->string('route_name')->nullable(); // Nama jalur/grup FO
            $table->string('area')->default('ungaran'); // Area: ungaran atau ambarawa
            $table->text('description')->nullable(); // Deskripsi titik
            $table->string('type')->default('pole'); // Jenis: pole, junction, hub, endpoint
            $table->enum('side_of_road', ['left', 'right', 'unknown'])
                  ->default('unknown')
                  ->comment('Posisi tiang relatif terhadap arah jalan: left (kiri), right (kanan), atau unknown (belum diketahui)');
            $table->string('status')->default('active'); // Status: active, inactive, maintenance
            
            // Kolom untuk menyimpan path gambar
            $table->string('isp_image')->nullable(); // Path gambar ISP
            $table->string('pole_image')->nullable(); // Path gambar tiang penuh
            $table->string('junction_box_image')->nullable(); // Path gambar JB/joint box
            
            $table->json('properties')->nullable(); // Data tambahan dalam format JSON
            $table->timestamps();
            
            // Index untuk performa
            $table->index(['area', 'status']);
            $table->index(['latitude', 'longitude']);
            $table->index(['route_name', 'sequence_number']);
            $table->index('side_of_road'); // Index untuk filtering berdasarkan sisi jalan
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
