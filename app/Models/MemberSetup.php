<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MemberSetup extends Model
{
    protected $table = 'member_setup';
    
    protected $fillable = ['mobile', 'type', 'pcent', 'created_at'];
    
    public $timestamps = false;
}