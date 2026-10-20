<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class State extends Model
{
    use HasFactory;

    protected $table = 'state';
    
    protected $fillable = ['state'];

    public $timestamps = true;

    /**
     * Get the locations for the state
     */
    public function locations()
    {
        return $this->hasMany(Location::class, 'state_id');
    }

    /**
     * Get the members in this state
     */
    public function members()
    {
        return $this->hasMany(Member::class, 'state_id');
    }

    /**
     * Get the users assigned to this state
     */
    public function users()
    {
        return $this->hasMany(User::class, 'state_id');
    }

    /**
     * Get users who have access to this state
     */
    public function accessibleUsers()
    {
        return $this->belongsToMany(User::class, 'user_states', 'state_id', 'user_id');
    }
}