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

    public function response()
    {
        return $this->belongsTo(FeedbackResponse::class, 'feedback_response_id');
    }

    public function getImagePathAttribute()
    {
        return $this->file_path;
    }
}
