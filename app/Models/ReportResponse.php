<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_id',
        'user_id',
        'message',
    ];

    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

	public function assets()
	{
		return $this->hasMany(ReportResponseAsset::class, 'report_response_id');
	}
}


