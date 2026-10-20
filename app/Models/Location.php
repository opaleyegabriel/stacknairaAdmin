<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    use HasFactory;

    protected $table = 'locations';
    
    protected $fillable = ['state_id', 'location'];

    public $timestamps = true;

    /**
     * Get the state that owns the location
     */
    public function state()
    {
        return $this->belongsTo(State::class, 'state_id');
    }

    /**
     * Get the members in this location
     */
    public function members()
    {
        return $this->hasMany(Member::class, 'location_id');
    }

    /**
     * Get the users assigned to this location
     */
    public function users()
    {
        return $this->hasMany(User::class, 'location_id');
    }

    /**
     * Get users who have access to this location
     */
    public function accessibleUsers()
    {
        return $this->belongsToMany(User::class, 'user_locations', 'location_id', 'user_id');
    }

    /**
     * Get the state name through relationship
     */
    public function getStateNameAttribute()
    {
        return $this->state->state ?? 'Unknown';
    }
}