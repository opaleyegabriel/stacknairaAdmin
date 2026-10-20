<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AjoGroup extends Model
{
    protected $table = 'ajo_groups';
    
    protected $fillable = [
        'group_name', 'amount', 'members', 'interval_type', 'start_date',
        'current_round', 'active_receiver_mobile', 'last_payout_date',
        'next_payout_date', 'status', 'created_at', 'joined_count', 'start_time'
    ];
    
    public $timestamps = false;
    
    protected $casts = [
        'amount' => 'decimal:2',
        'start_date' => 'datetime',
        'last_payout_date' => 'datetime',
        'next_payout_date' => 'datetime',
        'created_at' => 'datetime',
        'start_time' => 'datetime',
    ];
    
    /**
     * Get group members
     */
    public function members()
    {
        return $this->hasMany(AjoMember::class, 'group_id');
    }

    /**
     * Get group contributions
     */
    public function contributions()
    {
        return $this->hasMany(AjoContribution::class, 'group_id');
    }
    
    /**
     * Get group payouts
     */
    public function payouts()
    {
        return $this->hasMany(AjoPayout::class, 'group_id');
    }

    /**
     * Check if group is active
     */
    public function getIsActiveAttribute()
    {
        return $this->status === 'active';
    }

    /**
     * Check if group is completed
     */
    public function getIsCompletedAttribute()
    {
        return $this->status === 'completed';
    }

    /**
     * Get current members count
     * Use joined_count if available, otherwise count all members
     */
    public function getCurrentMembersCountAttribute()
    {
        return $this->joined_count ?? $this->members()->count();
    }

    /**
     * Check if group is full
     * Compare with the members field which seems to be the max members
     */
    public function getIsFullAttribute()
    {
        return $this->current_members_count >= $this->members;
    }

    /**
     * Calculate total contributions
     */
    public function getTotalContributionsAttribute()
    {
        return $this->contributions()->sum('amount');
    }

    /**
     * Calculate total payouts
     */
    public function getTotalPayoutsAttribute()
    {
        return $this->payouts()->sum('amount');
    }

    /**
     * Calculate group balance
     */
    public function getGroupBalanceAttribute()
    {
        return $this->total_contributions - $this->total_payouts;
    }

    /**
     * Get members who haven't received payout in current round
     * Since we don't have status, we'll check all members
     */
    public function getMembersWithoutPayoutAttribute()
    {
        return $this->members()->whereDoesntHave('payouts', function($query) {
            $query->where('round_no', $this->current_round);
        })->get();
    }

    /**
     * Get all members who have received payouts
     */
    public function getMembersWithPayoutAttribute()
    {
        return $this->members()->whereHas('payouts', function($query) {
            $query->where('round_no', $this->current_round);
        })->get();
    }

    /**
     * Get group performance summary
     */
    public function getPerformanceSummaryAttribute()
    {
        $totalExpected = $this->current_members_count * $this->amount * $this->current_round;
        $completionRate = $totalExpected > 0 ? ($this->total_contributions / $totalExpected) * 100 : 0;

        return [
            'total_expected' => $totalExpected,
            'total_contributions' => $this->total_contributions,
            'total_payouts' => $this->total_payouts,
            'group_balance' => $this->group_balance,
            'completion_rate' => $completionRate,
            'members_without_payout' => $this->members_without_payout->count(),
            'members_with_payout' => $this->members_with_payout->count(),
            'available_slots' => $this->members - $this->current_members_count,
            'max_members' => $this->members,
        ];
    }

    /**
     * Get the next expected receiver based on current round
     */
    public function getNextExpectedReceiverAttribute()
    {
        $membersWithoutPayout = $this->members_without_payout;
        return $membersWithoutPayout->isNotEmpty() ? $membersWithoutPayout->first() : null;
    }

    /**
     * Calculate average contribution per member
     */
    public function getAverageContributionPerMemberAttribute()
    {
        return $this->current_members_count > 0 ? $this->total_contributions / $this->current_members_count : 0;
    }

    /**
     * Calculate average payout per member
     */
    public function getAveragePayoutPerMemberAttribute()
    {
        $membersWithPayout = $this->members_with_payout->count();
        return $membersWithPayout > 0 ? $this->total_payouts / $membersWithPayout : 0;
    }
}