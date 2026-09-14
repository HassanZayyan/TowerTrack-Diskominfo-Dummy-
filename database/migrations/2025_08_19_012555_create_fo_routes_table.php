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
            
            // GeoJSON untuk jalur yang mengikuti jalan
            $table->json('geojson')->nullable();
            
            // Metadata routing
            $table->string('routing_profile')->default('driving'); // driving, walking, cycling
            $table->boolean('avoid_highways')->default(false);
            $table->boolean('avoid_tolls')->default(false);
            $table->json('waypoints')->nullable(); // Titik-titik intermediate
            
            // Route generation metadata
            $table->timestamp('geojson_generated_at')->nullable();
            $table->string('routing_service')->nullable(); // openrouteservice, mapbox, etc
            $table->decimal('actual_distance', 10, 2)->nullable(); // Jarak aktual dari routing service
            $table->integer('estimated_duration')->nullable(); // Durasi estimasi dalam detik
            
            $table->string('status')->default('active'); // Status: active, inactive, maintenance
            /*
             * Warna jalur untuk display di peta.
             *
             * The default was `#3B82F6`, stock Tailwind blue — the one hue
             * resources/js/lib/map-palette.ts rules out for the map, because a
             * blue line over an OSM basemap competes with the water it is drawn
             * on and with the application's own chrome. Any route created
             * without an explicit colour was guaranteed to come out in it.
             *
             * `#982700` is FO_ROUTE_COLORS[0], the first entry of the
             * categorical series actually calibrated for route identity and
             * verified for distinctness across deuteranopia and protanopia.
             */
            $table->string('color')->default('#982700');
            $table->decimal('total_distance', 8, 2)->nullable(); // Total jarak dalam kilometer
            $table->integer('total_points')->default(0); // Total titik FO dalam jalur
            $table->json('point_ids')->nullable(); // Array ID points yang terhubung dalam jalur
            $table->json('properties')->nullable(); // Data tambahan dalam format JSON
            
            $table->timestamps();
            
            // Index untuk performa
            $table->index(['area', 'status']);
            $table->index(['slug']);
            $table->index(['routing_profile', 'routing_service']);
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
