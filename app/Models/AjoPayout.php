<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AjoPayout extends Model
{
    protected $table = 'ajo_payouts';
    
    protected $fillable = [
        'group_id', 'round_no', 'receiver_mobile', 'receiver_name',
        'amount', 'paid_at'
    ];
    
    public $timestamps = false;
    
    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];
    
    public function group()
    {
        return $this->belongsTo(AjoGroup::class, 'group_id');
    }
    
    public function receiver()
    {
        return $this->belongsTo(Member::class, 'receiver_mobile', 'mobile');
    }
}