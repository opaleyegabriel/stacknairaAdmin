<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MemberBankWitness extends Model
{
    protected $table = 'MemberBankWitness';
    
    protected $fillable = [
        'mobile', 'bank', 'account_number', 'created_at', 
        'witnessMobile', 'name', 'address'
    ];
    
    public $timestamps = false;
}