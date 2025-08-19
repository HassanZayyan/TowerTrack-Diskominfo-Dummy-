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
    
    public function statuses()
    {
        return $this->hasMany(ReportStatus::class, 'report_response_id');
    }
    
    /**
     * Get the actual status models through the pivot
     */
    public function statusModels()
    {
        return $this->belongsToMany(Status::class, 'report_statuses', 'report_response_id')
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
        try {
            // Try to find status by ID or slug
            if (is_numeric($status)) {
                $statusModel = Status::find($status);
            } else {
                $statusModel = Status::where('slug', $status)->first();
            }
            
            // If status model found, create relationship
            if ($statusModel) {
                ReportStatus::create([
                    'report_response_id' => $this->id,
                    'status_id' => $statusModel->id,
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('Error setting status: ' . $e->getMessage());
            // Fail gracefully if statuses table doesn't exist
        }
    }
    
    /**
     * Get the current status of this response
     * 
     * @return Status|null
     */
    public function getCurrentStatus()
    {
        try {
            $reportStatus = $this->statuses()->latest()->first();
            if ($reportStatus) {
                return $reportStatus->status;
            }
            return null;
        } catch (\Exception $e) {
            \Log::error('Error getting current status: ' . $e->getMessage());
            return null;
        }
    }
}


