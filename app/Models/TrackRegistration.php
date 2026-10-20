<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrackRegistration extends Model
{
    protected $table = 'track_registration';
    
    protected $fillable = ['mobile', 'created_at'];
    
    public $timestamps = false;
}