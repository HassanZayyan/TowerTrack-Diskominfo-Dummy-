<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeedbackAsset extends Model
{
    use HasFactory;

    protected $table = 'feedback_assets';

    protected $fillable = [
        'feedback_id',
        'file_path',
        'file_name',
        'file_type',
        'mime_type',
        'file_size',
    ];

    protected $appends = [
        'image_path',
    ];

    public function feedback()
    {
        return $this->belongsTo(Feedback::class);
    }

    public function getImagePathAttribute()
    {
        return $this->file_path;
    }
}
