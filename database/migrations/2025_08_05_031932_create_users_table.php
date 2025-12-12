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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('avatar')->nullable();
            $table->string('password');
            $table->enum('role', ['admin', 'operator', 'complainant', 'tower_owner', 'provider_owner'])->default('complainant');
            $table->unsignedBigInteger('owner_id')->nullable();
            $table->unsignedBigInteger('fo_provider_id')->nullable();
            $table->boolean('banned')->default(false);
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
            
            // Add foreign key constraint for owner_id
            $table->foreign('owner_id')->references('id')->on('owners')->onDelete('set null');
            // Note: fo_provider_id foreign key will be added in create_fo_providers_table migration
            // after fo_providers table is created
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
