<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    // protected $fillable = [
    //     'name',
    //     'email',
    //     'password',
    // ];
    protected $fillable = ['name', 'email', 'phone', 'password', 'status',];


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
        ];
    }
    public function merchantData()
    {
        return $this->hasOne(Merchant::class, 'merchant', 'phone');
    }
    // In User.php model - Add these relationships
    public function state()
    {
        return $this->belongsTo(State::class, 'state_id');
    }

    public function location()
    {
        return $this->belongsTo(Location::class, 'location_id');
    }

    public function accessibleStates()
    {
        return $this->belongsToMany(State::class, 'user_states', 'user_id', 'state_id');
    }

    public function accessibleLocations()
    {
        return $this->belongsToMany(Location::class, 'user_locations', 'user_id', 'location_id');
    }
   
}
