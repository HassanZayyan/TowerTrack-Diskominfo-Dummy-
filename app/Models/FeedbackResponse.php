<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeedbackResponse extends Model
{
    use HasFactory;

    protected $table = 'feedback_responses';

    protected $fillable = [
        'feedback_id',
        'user_id',
        'message',
    ];

    public function feedback()
    {
        return $this->belongsTo(Feedback::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assets()
    {
        return $this->hasMany(FeedbackResponseAsset::class, 'feedback_response_id');
    }
}
