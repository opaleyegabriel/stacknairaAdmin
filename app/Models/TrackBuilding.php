<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrackBuilding extends Model
{
    protected $table = 'track_building';
    
    protected $fillable = ['mobile', 'created_at'];
    
    public $timestamps = false;
}