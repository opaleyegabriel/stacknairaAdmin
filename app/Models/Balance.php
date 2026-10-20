<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Balance extends Model
{
    protected $table = 'balances';
    
    protected $fillable = [
        'reference', 'description', 'mobile', 'account_number',
        'type', 'debit', 'credit', 'created_at'
    ];
    
    public $timestamps = false;
    
    protected $casts = [
        'debit' => 'decimal:2',
        'credit' => 'decimal:2',
        'created_at' => 'datetime',
    ];
}