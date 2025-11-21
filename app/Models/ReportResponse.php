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
        'sender_type',
        'sender_name',
        'sender_email',
        'sender_phone',
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

    public function isFromStaff(): bool
    {
        return $this->sender_type === 'staff';
    }

    public function senderDisplayName(): string
    {
        if ($this->user) {
            return $this->user->name;
        }

        if (!empty($this->sender_name)) {
            return $this->sender_name;
        }

        return $this->isFromGuest()
            ? __('Tamu')
            : __('Pelapor');
    }

    public function senderContact(): ?string
    {
        return $this->sender_email ?? $this->sender_phone;
    }

    public function isFromGuest(): bool
    {
        return $this->sender_type === 'guest';
    }

    public function isFromReporter(): bool
    {
        return $this->sender_type === 'reporter';
    }

	public function assets()
	{
		return $this->hasMany(ReportResponseAsset::class, 'report_response_id');
	}
}


