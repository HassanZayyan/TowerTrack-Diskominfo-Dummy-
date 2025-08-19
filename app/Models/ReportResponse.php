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
        'image_path',
        'file_type',
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
    
    public function statuses()
    {
        return $this->belongsToMany(Status::class, 'report_response_status')
                   ->withTimestamps();
    }
    
    /**
     * Set the status of this response
     * 
     * @param string|int $status Status ID or slug
     * @return void
     */
    public function setStatus($status)
    {
        if (is_numeric($status)) {
            $statusModel = Status::find($status);
        } else {
            $statusModel = Status::where('slug', $status)->first();
        }
        
        if ($statusModel) {
            $this->statuses()->sync([$statusModel->id]);
        }
    }
    
    /**
     * Get the current status of this response
     * 
     * @return Status|null
     */
    public function getCurrentStatus()
    {
        return $this->statuses()->latest('report_response_status.created_at')->first();
    }
}


