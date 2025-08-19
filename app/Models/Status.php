<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Status extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'color',
        'icon',
        'is_default',
    ];

    /**
     * Get all reports with this status
     */
    public function reports()
    {
        return $this->hasMany(Report::class);
    }

    /**
     * Get all report responses with this status
     */
    public function reportResponses()
    {
        return $this->belongsToMany(ReportResponse::class, 'report_response_status')
                    ->withTimestamps();
    }

    /**
     * Get the default status
     * 
     * @return Status|null
     */
    public static function getDefault()
    {
        return self::where('is_default', true)->first();
    }
}
