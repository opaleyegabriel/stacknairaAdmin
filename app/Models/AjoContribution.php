<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AjoContribution extends Model
{
    protected $table = 'ajo_contributions';
    
    protected $fillable = ['group_id', 'mobile', 'amount', 'round_no', 'created_at'];
    
    public $timestamps = false;
    
    protected $casts = [
        'amount' => 'decimal:2',
        'created_at' => 'datetime',
    ];
    
    public function group()
    {
        return $this->belongsTo(AjoGroup::class, 'group_id');
    }
    
    public function member()
    {
        return $this->belongsTo(Member::class, 'mobile', 'mobile');
    }
}