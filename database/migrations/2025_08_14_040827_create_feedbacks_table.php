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
        Schema::create('feedbacks', function (Blueprint $table) {
            $table->id();
            // Polymorphic relationship to Tower or FoPoint
            $table->string('feedbackable_type');
            $table->unsignedBigInteger('feedbackable_id');
            $table->index(['feedbackable_type', 'feedbackable_id']); // Index for better performance
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade'); // Made nullable for anonymous users
            $table->string('email')->nullable(); // For anonymous users
            $table->timestamp('email_verified_at')->nullable();
            $table->string('sender_phone')->nullable();
            $table->string('sender_name')->nullable();
            $table->string('category');
            $table->text('message');
            // Add reporter coordinates for cases where tower coordinates are not available
            $table->decimal('reporter_latitude', 10, 8)->nullable();
            $table->decimal('reporter_longitude', 11, 8)->nullable();
            $table->decimal('reporter_accuracy', 8, 2)->nullable(); // GPS accuracy in meters
            $table->timestamp('location_captured_at')->nullable();
            $table->boolean('is_public')->default(false); // Public visibility for feedbacks
            $table->enum('status', ['pending', 'in_progress', 'responded', 'resolved', 'closed'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedbacks');
    }
};
