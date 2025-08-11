<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportImage extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'report_id',
        'image_path',
    ];
    
    public function report()
    {
        return $this->belongsTo(Report::class);
    }
}
