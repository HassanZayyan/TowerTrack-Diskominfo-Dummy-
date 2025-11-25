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
        Schema::create('public_comments', function (Blueprint $table) {
            $table->id();
            $table->morphs('commentable'); // commentable_type dan commentable_id
            $table->foreignId('parent_id')
                  ->nullable()
                  ->constrained('public_comments')
                  ->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('guest_name')->nullable(); // Untuk guest
            $table->string('guest_email')->nullable(); // Untuk guest
            $table->string('guest_phone')->nullable(); // Optional untuk kontak
            $table->text('message');
            $table->boolean('is_approved')->default(true); // Auto-approve atau moderation
            $table->timestamps();
            $table->softDeletes(); // Untuk moderation
            
            // Indexes untuk performa (morphs() sudah membuat index untuk commentable_type dan commentable_id)
            $table->index('parent_id');
            $table->index('user_id');
            $table->index('is_approved');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('public_comments');
    }
};
