<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Merchant extends Model
{
    use HasFactory;

    protected $table = 'merchant';

    protected $fillable = [
        'name',
        'merchant',
        'base_salary',
        'status',
        'consecutive_fails',
        'date_employed',
        'target',
    ];

    protected $casts = [
        'base_salary' => 'decimal:2',
        'status' => 'boolean',
        'date_employed' => 'datetime',
        'created_at' => 'datetime',
    ];
}