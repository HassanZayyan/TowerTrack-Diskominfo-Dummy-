<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'banned',
        'owner_id',
        'avatar',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'banned' => 'boolean',
        ];
    }

    /**
     * Check if user is staff (admin, operator, or tower_owner)
     * Tower owner is considered staff for basic admin access
     */
    public function isStaff(): bool
    {
        return in_array($this->role, ['admin', 'operator', 'tower_owner'], true);
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is regular user
     */
    public function isUser(): bool
    {
        return $this->role === 'user';
    }

    /**
     * Check if user is tower owner
     */
    public function isTowerOwner(): bool
    {
        return $this->role === 'tower_owner';
    }

    /**
     * Check if user is complainant
     */
    public function isComplainant(): bool
    {
        return $this->role === 'complainant';
    }

    /**
     * One-to-many relationship with feedbacks
     */
    public function feedbacks()
    {
        return $this->hasMany(Feedback::class);
    }

    /**
     * One-to-many relationship with feedback responses
     */
    public function feedbackResponses()
    {
        return $this->hasMany(FeedbackResponse::class);
    }

    /**
     * Relationship with owner (for tower owners)
     */
    public function owner()
    {
        return $this->belongsTo(Owner::class, 'owner_id');
    }

    /**
     * Get towers owned by this user (if tower owner)
     */
    public function ownedTowers()
    {
        if ($this->role !== 'tower_owner') {
            return collect();
        }
        
        return $this->owner ? $this->owner->towers : collect();
    }
}
