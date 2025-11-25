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
        // Indexes for reports table
        if (Schema::hasTable('reports')) {
            Schema::table('reports', function (Blueprint $table) {
                // Composite index for public reports query (most common)
                $table->index(['is_public', 'email_verified_at', 'created_at'], 'reports_public_verified_created_idx');
                
                // Index for user's own reports
                $table->index(['user_id', 'created_at'], 'reports_user_created_idx');
                
                // Index for guest private message tracking
                $table->index(['email', 'reporter_phone', 'is_public'], 'reports_guest_tracking_idx');
                
                // Index for status filtering
                $table->index(['status_id', 'created_at'], 'reports_status_created_idx');
            });
        }

        // Indexes for feedbacks table
        if (Schema::hasTable('feedbacks')) {
            Schema::table('feedbacks', function (Blueprint $table) {
                // Composite index for public feedbacks query
                $table->index(['is_public', 'email_verified_at', 'created_at'], 'feedbacks_public_verified_created_idx');
                
                // Index for user's own feedbacks
                $table->index(['user_id', 'created_at'], 'feedbacks_user_created_idx');
                
                // Index for guest private message tracking
                $table->index(['email', 'sender_phone', 'is_public'], 'feedbacks_guest_tracking_idx');
                
                // Index for status filtering
                $table->index(['status', 'created_at'], 'feedbacks_status_created_idx');
            });
        }

        // Indexes for public_comments table
        if (Schema::hasTable('public_comments')) {
            Schema::table('public_comments', function (Blueprint $table) {
                // Composite index for commentable queries with approval status
                $table->index(['commentable_type', 'commentable_id', 'is_approved', 'created_at'], 'comments_commentable_approved_created_idx');
                
                // Index for nested replies
                $table->index(['parent_id', 'is_approved', 'created_at'], 'comments_parent_approved_created_idx');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('reports')) {
            Schema::table('reports', function (Blueprint $table) {
                $table->dropIndex('reports_public_verified_created_idx');
                $table->dropIndex('reports_user_created_idx');
                $table->dropIndex('reports_guest_tracking_idx');
                $table->dropIndex('reports_status_created_idx');
            });
        }

        if (Schema::hasTable('feedbacks')) {
            Schema::table('feedbacks', function (Blueprint $table) {
                $table->dropIndex('feedbacks_public_verified_created_idx');
                $table->dropIndex('feedbacks_user_created_idx');
                $table->dropIndex('feedbacks_guest_tracking_idx');
                $table->dropIndex('feedbacks_status_created_idx');
            });
        }

        if (Schema::hasTable('public_comments')) {
            Schema::table('public_comments', function (Blueprint $table) {
                $table->dropIndex('comments_commentable_approved_created_idx');
                $table->dropIndex('comments_parent_approved_created_idx');
            });
        }
    }
};
