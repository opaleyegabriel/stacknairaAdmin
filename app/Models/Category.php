<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $table = 'category';
    
    protected $fillable = [
        'name',
        'month',
        'dailyMin',
        'initialDay',
        'OpenCard',
        'created_at'
    ];

    protected $casts = [
        'dailyMin' => 'decimal:2',
        'OpenCard' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    /**
     * Calculate monthly amount (dailyMin * 30)
     */
    public function getMonthlyAmountAttribute()
    {
        return $this->dailyMin * 30;
    }

    /**
     * Get members in this category
     */
    public function members()
    {
        return $this->hasMany(Member::class, 'category', 'name');
    }
}