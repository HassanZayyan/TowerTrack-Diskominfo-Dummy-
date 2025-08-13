<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Owner extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'alamat',
    ];

    /**
     * Many-to-many relationship with towers
     */
    public function towers(): BelongsToMany
    {
        return $this->belongsToMany(Tower::class, 'tower_owners');
    }
}
