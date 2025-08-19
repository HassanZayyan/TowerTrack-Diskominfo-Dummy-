<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportStatus extends Model
{
    protected $fillable = [
        'report_response_id',
        'status_id',
    ];

    /**
     * Get the response that owns this status.
     */
    public function response(): BelongsTo
    {
        return $this->belongsTo(ReportResponse::class, 'report_response_id');
    }

    /**
     * Get the status.
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(Status::class);
    }
}
