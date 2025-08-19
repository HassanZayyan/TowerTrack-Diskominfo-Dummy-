<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportImage extends Model
{
    use HasFactory;
    
    // Use the report_assets table
    protected $table = 'report_assets';
    
    protected $fillable = [
        'report_id',
        'file_path', // Changed from image_path to match the actual column name
        'file_type',
    ];
    
    protected $appends = [
        'image_path', // Append image_path as virtual attribute
    ];
    
    public function getImagePathAttribute()
    {
        return $this->file_path;
    }
    
    public function report()
    {
        return $this->belongsTo(Report::class);
    }
}
