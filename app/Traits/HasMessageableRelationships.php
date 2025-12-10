<?php

namespace App\Traits;

/**
 * Trait for standardizing relationship loading for Report and Feedback models.
 * Provides DRY methods for eager loading common relationships.
 */
trait HasMessageableRelationships
{
    /**
     * Get standard relationships for Report model.
     * 
     * @return array
     */
    protected function getReportRelationships(): array
    {
        return [
            'reportable', // Polymorphic - load all columns to avoid SQL errors
            'user:id,name,email',
            'images:id,report_id,file_path,file_type',
            'responses' => function ($q) {
                $q->select('id', 'report_id', 'message', 'created_at', 'user_id', 
                          'sender_type', 'sender_name', 'sender_email', 'sender_phone')
                  ->with(['user:id,name', 'assets:id,report_response_id,file_path,file_type']);
            },
        ];
    }

    /**
     * Get standard relationships for Feedback model.
     * 
     * @return array
     */
    protected function getFeedbackRelationships(): array
    {
        return [
            'feedbackable', // Polymorphic - load all columns to avoid SQL errors
            'user:id,name,email',
            'assets:id,feedback_id,file_path,file_type',
            'responses' => function ($q) {
                $q->select('id', 'feedback_id', 'created_at', 'user_id', 'message',
                          'sender_type', 'sender_name', 'sender_email', 'sender_phone')
                  ->with(['user:id,name', 'assets:id,feedback_response_id,file_path,file_type']);
            },
        ];
    }

    /**
     * Get relationships based on model type.
     * 
     * @param mixed $model
     * @return array
     */
    protected function getMessageableRelationships($model): array
    {
        if ($model instanceof \App\Models\Report) {
            return $this->getReportRelationships();
        }
        
        if ($model instanceof \App\Models\Feedback) {
            return $this->getFeedbackRelationships();
        }
        
        return [];
    }
}




