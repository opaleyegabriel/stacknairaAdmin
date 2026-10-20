<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AjoMember extends Model
{
    protected $table = 'ajo_members';
    
    protected $fillable = [
        'group_id', 'mobile', 'name', 'joined_at', 'left_at',
        'rejoined_at', 'is_system', 'has_received', 'received_round', 'received_date'
    ];
    
    public $timestamps = false;
    
    protected $casts = [
        'joined_at' => 'datetime',
        'left_at' => 'datetime',
        'rejoined_at' => 'datetime',
        'received_date' => 'datetime',
        'is_system' => 'boolean',
        'has_received' => 'boolean',
    ];
    
    /**
     * Get the group this member belongs to
     */
    public function group()
    {
        return $this->belongsTo(AjoGroup::class, 'group_id');
    }
    
    /**
     * Get the member details
     */
    public function member()
    {
        return $this->belongsTo(AjoMember::class, 'mobile', 'mobile');
    }

    /**
     * Get member contributions to this group
     */
    public function contributions()
    {
        return $this->hasMany(AjoContribution::class, 'mobile', 'mobile')
                    ->where('group_id', $this->group_id);
    }

    /**
     * Get member payouts from this group
     */
    public function payouts()
    {
        return $this->hasMany(AjoPayout::class, 'receiver_mobile', 'mobile')
                    ->where('group_id', $this->group_id);
    }

    /**
     * Calculate total contributions by this member
     */
    public function getTotalContributionsAttribute()
    {
        return $this->contributions()->sum('amount');
    }

    /**
     * Calculate total payouts to this member
     */
    public function getTotalPayoutsAttribute()
    {
        return $this->payouts()->sum('amount');
    }

    /**
     * Calculate net position (contributions - payouts)
     */
    public function getNetPositionAttribute()
    {
        return $this->total_contributions - $this->total_payouts;
    }

    /**
     * Check if member has received payout in current group
     */
    public function getHasReceivedPayoutAttribute()
    {
        return $this->payouts()->exists();
    }

    /**
     * Get the last payout received
     */
    public function getLastPayoutAttribute()
    {
        return $this->payouts()->orderBy('created_at', 'desc')->first();
    }

    /**
     * Get contribution frequency (average days between contributions)
     */
    public function getContributionFrequencyAttribute()
    {
        $contributions = $this->contributions()->orderBy('created_at')->get();
        if ($contributions->count() < 2) {
            return null;
        }

        $firstDate = $contributions->first()->created_at;
        $lastDate = $contributions->last()->created_at;
        $daysDiff = $firstDate->diffInDays($lastDate);
        
        return $daysDiff > 0 ? $contributions->count() / $daysDiff : null;
    }
}