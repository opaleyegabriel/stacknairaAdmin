<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Referral extends Model
{
    protected $table = 'referrals';
    
    protected $fillable = ['member', 'referedBy', 'amount', 'created_at'];
    
    public $timestamps = false;
    
    public function referredMember()
    {
        return $this->belongsTo(Member::class, 'member', 'mobile');
    }
    
    public function referrer()
    {
        return $this->belongsTo(Member::class, 'referedBy', 'mobile');
    }
     /**
     * Scope to get referrals by specific referrer
     */
    public function scopeByReferrer(Builder $query, string $referrerMobile): Builder
    {
        return $query->where('referedBy', $referrerMobile);
    }
    
    /**
     * Scope to get referrals for logged-in merchant
     */
    public function scopeForLoggedInMerchant(Builder $query): Builder
    {
        $merchantMobile = auth()->user()->mobile ?? auth()->user()->phone;
        return $query->where('referedBy', $merchantMobile);
    }
    public function getMemberExistsAttribute()
    {
        return !is_null($this->referredMember);
    }
}