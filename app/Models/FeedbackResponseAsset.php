<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeedbackResponseAsset extends Model
{
    use HasFactory;
    
    protected $table = 'feedback_response_assets';
    
    protected $fillable = [
        'feedback_response_id',
        'file_path',
        'file_name',
        'file_type',
        'mime_type',
        'file_size',
    ];
    
    protected $appends = [
        'image_path',
    ];
    
    public function feedbackResponse()
    {
        return $this->belongsTo(FeedbackResponse::class);
    }
    
    public function getImagePathAttribute()
    {
        if (!$this->file_path) {
            return null;
        }
        
        return asset('storage/' . $this->file_path);
    }
}
