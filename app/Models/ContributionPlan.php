<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContributionPlan extends Model
{
    use HasFactory;

    protected $table = 'contribution_plans';
    
    protected $fillable = [
        'mobile',
        'amount',
        'frequency',
        'status',
        'start_date',
        'end_date',
        'closed_at'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'closed_at' => 'datetime',
    ];

    /**
     * Get the member associated with this contribution plan
     */
    public function member()
    {
        return $this->belongsTo(Member::class, 'mobile', 'mobile');
    }

    /**
     * Get contributions made for this plan
     */
    public function contributions()
    {
        return $this->hasMany(AjoContribution::class, 'mobile', 'mobile');
    }

    /**
     * Check if plan is active
     */
    public function getIsActiveAttribute()
    {
        return $this->status === 'ACTIVE';
    }

    /**
     * Check if plan is completed
     */
    public function getIsCompletedAttribute()
    {
        return $this->status === 'COMPLETED';
    }

    /**
     * Calculate total contributions made
     */
    public function getTotalContributionsAttribute()
    {
        return $this->contributions()->sum('amount');
    }

    /**
     * Calculate remaining amount
     */
    public function getRemainingAmountAttribute()
    {
        return max(0, $this->amount - $this->total_contributions);
    }

    /**
     * Calculate completion percentage
     */
    public function getCompletionPercentageAttribute()
    {
        if ($this->amount <= 0) return 0;
        return min(100, ($this->total_contributions / $this->amount) * 100);
    }
}