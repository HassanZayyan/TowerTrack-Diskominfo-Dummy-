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
        Schema::create('guest_email_verifications', function (Blueprint $table) {
            $table->id();
            $table->string('verifiable_type'); // 'App\Models\Feedback' or 'App\Models\Report'
            $table->unsignedBigInteger('verifiable_id');
            $table->string('email');
            $table->string('token', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['verifiable_type', 'verifiable_id']);
            $table->index('token');
            $table->index('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('guest_email_verifications');
    }
};
