<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Carbon\Carbon;

class GuestEmailVerification extends Model
{
    protected $fillable = [
        'verifiable_type',
        'verifiable_id',
        'email',
        'token',
        'expires_at',
        'verified_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    /**
     * Get the parent verifiable model (Feedback or Report).
     */
    public function verifiable()
    {
        return $this->morphTo();
    }

    /**
     * Create a new verification token for a guest message.
     *
     * @param Model $model Feedback or Report model
     * @param string $email
     * @return self
     */
    public static function createFor(Model $model, string $email): self
    {
        // Delete any existing unverified tokens for this model
        static::where('verifiable_type', get_class($model))
            ->where('verifiable_id', $model->id)
            ->whereNull('verified_at')
            ->delete();

        return static::create([
            'verifiable_type' => get_class($model),
            'verifiable_id' => $model->id,
            'email' => $email,
            'token' => Str::random(64),
            'expires_at' => Carbon::now()->addHours(24), // 24 hours expiry
        ]);
    }

    /**
     * Verify the token.
     *
     * @param string $token
     * @return self|null
     */
    public static function verifyToken(string $token): ?self
    {
        $verification = static::where('token', $token)
            ->whereNull('verified_at')
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$verification) {
            return null;
        }

        $verification->verified_at = Carbon::now();
        $verification->save();

        // Mark email as verified in the model
        $model = $verification->verifiable;
        if ($model && method_exists($model, 'markEmailAsVerified')) {
            $model->markEmailAsVerified();
        }

        return $verification;
    }

    /**
     * Check if token is valid and not expired.
     *
     * @param string $token
     * @return bool
     */
    public static function isValidToken(string $token): bool
    {
        return static::where('token', $token)
            ->whereNull('verified_at')
            ->where('expires_at', '>', Carbon::now())
            ->exists();
    }

    /**
     * Clean up expired tokens (can be run via scheduled task).
     */
    public static function cleanupExpired(): int
    {
        return static::where('expires_at', '<', Carbon::now())
            ->whereNull('verified_at')
            ->delete();
    }
}
