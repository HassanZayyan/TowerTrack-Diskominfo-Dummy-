<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportAsset extends Model
{
	use HasFactory;

	protected $fillable = [
		'report_id',
		'file_path',
		'file_name',
		'file_type',
		'mime_type',
		'file_size',
	];

	protected $appends = [
		'image_path',
	];

	public function report()
	{
		return $this->belongsTo(Report::class);
	}

	public function getImagePathAttribute()
	{
		return $this->file_path;
	}
}




