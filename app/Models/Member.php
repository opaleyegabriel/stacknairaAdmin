<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Carbon\Carbon;

class Member extends Model
{
    use HasFactory;

    protected $table = 'members';
    
    protected $primaryKey = 'id';
    
    public $timestamps = true;
    
    protected $fillable = [
        'name',
        'email', 
        'mobile',
        'pwd',
        'rmobile',
        'category',
        'bank_name',
        'account_name',
        'account_number',
        'nstatus',
        'cooperator',
        'photo',
        'created_at'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'nstatus' => 'boolean',
        'cooperator' => 'boolean',
    ];
    protected $appends = ['photo_url'];


    // In your Member.php model - Add this ONE method
    // In Member.php - Update the global scope
// In Member.php - Replace with this corrected logic
protected static function boot()
{
    parent::boot();

    static::addGlobalScope('location_access', function ($query) {
        $user = auth()->user();
        
        if ($user && !$user->hasRole('Super Admin')) {
            $query->where(function ($q) use ($user) {
                $hasAnyRestriction = false;
                
                // Case 1: User has primary location - MOST RESTRICTIVE
                if ($user->location_id) {
                    $q->where('location_id', $user->location_id);
                    $hasAnyRestriction = true;
                }
                // Case 2: User has primary state but no location
                elseif ($user->state_id) {
                    $q->where('state_id', $user->state_id);
                    $hasAnyRestriction = true;
                }
                
                // Case 3: Accessible locations - MORE SPECIFIC than states
                if ($user->accessibleLocations && $user->accessibleLocations->count() > 0) {
                    $accessibleLocationIds = $user->accessibleLocations->pluck('id')->toArray();
                    if ($hasAnyRestriction) {
                        $q->orWhereIn('location_id', $accessibleLocationIds);
                    } else {
                        $q->whereIn('location_id', $accessibleLocationIds);
                        $hasAnyRestriction = true;
                    }
                }
                
                // Case 4: Accessible states - LEAST SPECIFIC (only if no locations specified)
                if ($user->accessibleStates && $user->accessibleStates->count() > 0) {
                    $accessibleStateIds = $user->accessibleStates->pluck('id')->toArray();
                    
                    // Only apply state access if user doesn't have more specific location access
                    $hasLocationAccess = $user->location_id || 
                                        ($user->accessibleLocations && $user->accessibleLocations->count() > 0);
                    
                    if (!$hasLocationAccess) {
                        if ($hasAnyRestriction) {
                            $q->orWhereIn('state_id', $accessibleStateIds);
                        } else {
                            $q->whereIn('state_id', $accessibleStateIds);
                        }
                    }
                }
                
                // If no restrictions at all, show nothing
                if (!$hasAnyRestriction && 
                    (!$user->accessibleStates || $user->accessibleStates->count() === 0)) {
                    $q->where('id', 0); // Show no results
                }
            });
        }
    });
}
    /**
     * Get the member setup (SHARES, SAVINGS, etc.)
     */
    public function setups(): HasMany
    {
        return $this->hasMany(MemberSetup::class, 'mobile', 'mobile');
    }

    /**
     * Get specific setup by type
     */
    public function setup($type): HasOne
    {
        return $this->hasOne(MemberSetup::class, 'mobile', 'mobile')->where('type', $type);
    }

    /**
     * Check if member has building payment
     */
    public function buildingTrack(): HasOne
    {
        return $this->hasOne(TrackBuilding::class, 'mobile', 'mobile');
    }

    /**
     * Check if member has completed registration
     */
    public function registrationTrack(): HasOne
    {
        return $this->hasOne(TrackRegistration::class, 'mobile', 'mobile');
    }

    /**
     * Get bank witness information
     */
    public function bankWitness(): HasOne
    {
        return $this->hasOne(MemberBankWitness::class, 'mobile', 'mobile');
    }

    /**
     * Get referrals made by this member
     */
    public function referralsMade(): HasMany
    {
        return $this->hasMany(Referral::class, 'referedBy', 'mobile');
    }

    /**
     * Get who referred this member
     */
    public function referredBy(): HasOne
    {
        return $this->hasOne(Referral::class, 'member', 'mobile');
    }

    /**
     * Get contribution plan
     */
    public function contributionPlan(): HasOne
    {
        return $this->hasOne(ContributionPlan::class, 'mobile', 'mobile');
    }

    /**
     * Get all balances
     */
    public function balances(): HasMany
    {
        return $this->hasMany(Balance::class, 'mobile', 'mobile');
    }

    /**
     * Get balance by type
     */
    public function balance($type): HasOne
    {
        return $this->hasOne(Balance::class, 'mobile', 'mobile')->where('type', $type);
    }

    /**
     * Get Ajo group memberships
     */
    public function ajoMemberships(): HasMany
    {
        return $this->hasMany(AjoMember::class, 'mobile', 'mobile');
    }

    /**
     * Get Ajo contributions
     */
    public function ajoContributions(): HasMany
    {
        return $this->hasMany(AjoContribution::class, 'mobile', 'mobile');
    }

    /**
     * Get Ajo payouts received
     */
    public function ajoPayouts(): HasMany
    {
        return $this->hasMany(AjoPayout::class, 'receiver_mobile', 'mobile');
    }

    /**
     * Scope for active members
     */
    public function scopeActive($query)
    {
        return $query->where('nstatus', 1);
    }

    /**
     * Scope for cooperators
     */
    public function scopeCooperator($query)
    {
        return $query->where('cooperator', 1);
    }

    /**
     * Get total shares amount
     */
    public function getTotalSharesAttribute()
    {
        return $this->balances()->where('type', 'SHARES')->sum('debit') - 
               $this->balances()->where('type', 'SHARES')->sum('credit');
    }

    /**
     * Get total savings amount
     */
    public function getTotalSavingsAttribute()
    {
        return $this->balances()->where('type', 'SAVINGS')->sum('debit') - 
               $this->balances()->where('type', 'SAVINGS')->sum('credit');
    }

    /**
     * Get total wallet balance
     */
    public function getWalletBalanceAttribute()
    {
        return $this->balances()->where('type', 'WALLET')->sum('debit') - 
               $this->balances()->where('type', 'WALLET')->sum('credit');
    }
    /**
     * Get total AJO balance
     */
    public function getAjoBalanceAttribute()
    {
        return $this->balances()->where('type', 'AJO')->sum('debit') - 
               $this->balances()->where('type', 'AJO')->sum('credit');
    }

    /**
     * Check if member has building payment
     */
    public function getHasBuildingPaymentAttribute()
    {
        return $this->buildingTrack()->exists();
    }

    /**
     * Check if member has completed registration
     */
    public function getHasCompletedRegistrationAttribute()
    {
        return $this->registrationTrack()->exists();
    }

    /**
     * Get referral count
     */
    public function getReferralCountAttribute()
    {
        return $this->referralsMade()->count();
    }

    /**
     * Get total referral earnings
     */
    public function getReferralEarningsAttribute()
    {
        return $this->referralsMade()->sum('amount');
    }


     /**
     * Get the photo URL
     */
      public function getPhotoUrlAttribute()
    {
        if ($this->photo) {
            return asset('storage/member-photos/' . $this->photo);
        }
        
        return asset('storage/default-avatar.png');
    }

    /**
     * Get statement data for PDF
     */
    public function getStatementData($startDate = null, $endDate = null)
    {
        $query = $this->balances();
        
        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
        }
        
        $transactions = $query->orderBy('created_at', 'desc')->get();
        
        $openingBalance = $this->calculateOpeningBalance($startDate);
        $closingBalance = $this->calculateClosingBalance($endDate);
        
        return [
            'member' => $this,
            'transactions' => $transactions,
            'opening_balance' => $openingBalance,
            'closing_balance' => $closingBalance,
            'period' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
            'summary' => $this->getBalanceSummary(),
        ];
    }

    private function calculateOpeningBalance($startDate)
    {
        if (!$startDate) {
            return 0;
        }
        
        return $this->balances()
            ->where('created_at', '<', $startDate)
            ->get()
            ->reduce(function ($carry, $transaction) {
                return $carry + $transaction->debit - $transaction->credit;
            }, 0);
    }

    private function calculateClosingBalance($endDate)
    {
        $query = $this->balances();
        
        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }
        
        return $query->get()
            ->reduce(function ($carry, $transaction) {
                return $carry + $transaction->debit - $transaction->credit;
            }, 0);
    }

    private function getBalanceSummary()
    {
        // Calculate total AJO contributions made by member
        $totalAjoContributions = AjoContribution::where('mobile', $this->mobile)
            ->sum('amount');

        // Calculate total AJO payouts received by member
        $totalAjoPayouts = $this->ajoPayouts()
            ->sum('amount');

        // Calculate net AJO balance (contributions - payouts + normal AJO transactions)
        $netAjoBalance = $totalAjoContributions - $totalAjoPayouts;

        // Calculate normal AJO transactions (from balances table)
        $ajoNormalBalance = $this->balances->where('type', 'AJO')->sum('debit') - 
                        $this->balances->where('type', 'AJO')->sum('credit');

        // Total AJO balance (group net balance + normal AJO transactions)
        $totalAjoBalance = $netAjoBalance + $ajoNormalBalance;

        return [
            'SHARES' => $this->total_shares,
            'SAVINGS' => $this->total_savings,
            'SSAVINGS' => $this->balances->where('type', 'SSAVINGS')->sum('debit') - 
                        $this->balances->where('type', 'SSAVINGS')->sum('credit'),
            'WALLET' => $this->wallet_balance,
            'BUILDING' => $this->balances->where('type', 'BUILDING')->sum('debit') - 
                        $this->balances->where('type', 'BUILDING')->sum('credit'),
            'AJO' => $totalAjoBalance,
            'AJO_GROUP' => $netAjoBalance,
            'AJO_NORMAL' => $ajoNormalBalance,
            'AJO_CONTRIBUTIONS' => $totalAjoContributions,
            'AJO_PAYOUTS' => $totalAjoPayouts,
        ];
    }

    // Add to your Member model
    /**
     * Get the category details
     */
    /**
     * Get the category details
     */
    public function categoryDetails()
    {
        return $this->belongsTo(Category::class, 'category', 'name');
    }

    /**
     * Calculate cooperative obligations with detailed owing calculation
     */
    // public function getCooperativeObligations()
    // {
    //     $category = $this->categoryDetails;
        
    //     if (!$category) {
    //         return [
    //             'status' => 'no_category',
    //             'message' => 'No category assigned',
    //             'amount_owed' => 0,
    //             'months_owed' => 0,
    //             'total_owed' => 0,
    //             'registration_status' => 'not_registered'
    //         ];
    //     }

    //     // Check registration status
    //     $registration = $this->registrationTrack;
    //     $hasRegistered = !is_null($registration);
        
    //     if (!$hasRegistered) {
    //         return [
    //             'status' => 'not_registered',
    //             'message' => 'No open card has been deducted and you have not registered',
    //             'amount_owed' => 0,
    //             'months_owed' => 0,
    //             'total_owed' => 0,
    //             'registration_status' => 'not_registered',
    //             'monthly_amount' => $category->monthly_amount
    //         ];
    //     }

    //     try {
    //         // Calculate monthly amount (dailyMin * 30)
    //         $monthlyAmount = $category->dailyMin * 30;
            
    //         // Get registration date
    //         $registrationDate = \Carbon\Carbon::parse($registration->created_at);
    //         $currentDate = now();
    //         $currentMonthStart = $currentDate->copy()->startOfMonth();
    //         $currentMonthEnd = $currentDate->copy()->endOfMonth();
    //         $currentDay = $currentDate->day;

    //         // Initialize variables
    //         $AETHP = 0; // Amount Expected To Have Paid
    //         $APAID = 0; // Amount Paid
    //         $AmountOwing = 0;
    //         $isOwing = false;
    //         $calculatedMonths = 0; // Months used for expected amount calculation
    //         $monthsOwed = 0; // Actual months behind for display

    //         // Check if registration is in current month
    //         $isRegistrationInCurrentMonth = $registrationDate->between($currentMonthStart, $currentMonthEnd);
            
    //         if ($isRegistrationInCurrentMonth) {
    //             $registrationDay = $registrationDate->day;
                
    //             if ($registrationDay >= 28) {
    //                 // Registered between 28-31: count from previous month
    //                 $previousMonth = $registrationDate->copy()->subMonth()->startOfMonth();
    //                 $calculatedMonths = (int) $previousMonth->diffInMonths($currentMonthStart);
    //                 $AETHP = $calculatedMonths * $monthlyAmount;
    //             } else {
    //                 // Registered before 28th
    //                 if ($currentDay < 28) {
    //                     $AETHP = 0;
    //                     $calculatedMonths = 0;
    //                 } else {
    //                     $AETHP = $monthlyAmount;
    //                     $calculatedMonths = 1;
    //                 }
    //             }
    //         } else {
    //             // Registration in previous months
    //             $registrationDay = $registrationDate->day;
                
    //             if ($currentDay < 28) {
    //                 $previousMonth = $currentDate->copy()->subMonth()->startOfMonth();
    //                 $calculatedMonths = (int) $registrationDate->diffInMonths($previousMonth);
                    
    //                 if ($registrationDay < 28 && $currentDay < 28) {
    //                     $calculatedMonths = $calculatedMonths + 1;
    //                     $AETHP = $calculatedMonths * $monthlyAmount;
    //                 } elseif ($registrationDay < 28 && $currentDay > 28) {
    //                     $calculatedMonths = $calculatedMonths + 2;
    //                     $AETHP = $calculatedMonths * $monthlyAmount;
    //                 }
    //             } else {
    //                 $calculatedMonths = (int) $registrationDate->diffInMonths($currentMonthStart) + 2;
    //                 $AETHP = $calculatedMonths * $monthlyAmount;
    //             }
    //         }

    //         // Calculate amount paid (APAID) - sum of SHARES, SSAVINGS, SAVINGS, BUILDING since registration
    //         $amountPaid = $this->balances()
    //             ->whereIn('type', ['SHARES', 'SSAVINGS', 'SAVINGS', 'BUILDING'])
    //             ->where('created_at', '>=', $registrationDate)
    //             ->where('created_at', '<=', $currentMonthEnd)
    //             ->sum('debit');

    //         $APAID = (float) $amountPaid;

    //         // Check if member is owing
    //         $isOwing = $AETHP > $APAID;
    //         $AmountOwing = $isOwing ? ($AETHP - $APAID) : 0;

    //         // Calculate actual months owed based on payment
    //         if ($isOwing && $monthlyAmount > 0) {
    //             // Calculate how many FULL months they still owe
    //             $paidMonths = floor($APAID / $monthlyAmount);
    //             $monthsOwed = $calculatedMonths - $paidMonths;
                
    //             // Ensure at least 1 month if owing anything
    //             $monthsOwed = max(1, $monthsOwed);
    //         } else {
    //             $monthsOwed = 0;
    //         }

    //         // Get current wallet balance for distribution capability
    //         $walletBalance = $this->wallet_balance;

    //         // Check if member can pay the owed amount
    //         $canPayOwing = $walletBalance >= $AmountOwing;
    //         $remainingAfterOwing = $walletBalance - $AmountOwing;

    //         return [
    //             'status' => $isOwing ? 'owing' : 'up_to_date',
    //             'message' => $isOwing ? 
    //                 "Member is owing ₦" . number_format($AmountOwing, 2) . " for " . $monthsOwed . " month(s)" .
    //                 ($canPayOwing ? 
    //                     ". Can pay from wallet balance." : 
    //                     ". Insufficient wallet balance (₦" . number_format($walletBalance, 2) . ")") :
    //                 "Member is up-to-date with payments",
    //             'monthly_amount' => $monthlyAmount,
    //             'months_owed' => $monthsOwed, // Actual months behind after considering payments
    //             'total_owed' => $AmountOwing,
    //             'amount_expected_to_have_paid' => $AETHP,
    //             'amount_paid' => $APAID,
    //             'registration_date' => $registrationDate->format('Y-m-d H:i:s'),
    //             'registration_status' => 'registered',
    //             'category_details' => $category,
    //             'payment_status' => [
    //                 'is_owing' => $isOwing,
    //                 'can_pay' => $canPayOwing,
    //                 'wallet_balance' => $walletBalance,
    //                 'remaining_after_owing' => $remainingAfterOwing,
    //             ],
    //             'calculation_details' => [
    //                 'calculated_months' => $calculatedMonths,
    //                 'paid_months' => isset($paidMonths) ? $paidMonths : 0,
    //                 'current_day' => $currentDay,
    //                 'registration_day' => $registrationDate->day,
    //                 'is_registration_in_current_month' => $isRegistrationInCurrentMonth,
    //                 'current_month_start' => $currentMonthStart->format('Y-m-d'),
    //                 'current_month_end' => $currentMonthEnd->format('Y-m-d'),
    //             ]
    //         ];

    //     } catch (\Exception $e) {
    //         \Log::error('Error calculating cooperative obligations for member ' . $this->id . ': ' . $e->getMessage());
            
    //         return [
    //             'status' => 'error',
    //             'message' => 'Error calculating obligations: ' . $e->getMessage(),
    //             'amount_owed' => 0,
    //             'months_owed' => 0,
    //             'total_owed' => 0,
    //             'registration_status' => 'unknown'
    //         ];
    //     }
    // }

    public function getCooperativeObligations()
    {
        $category = $this->categoryDetails;
        
        if (!$category) {
            return [
                'status' => 'no_category',
                'message' => 'No category assigned',
                'amount_owed' => 0,
                'months_owed' => 0,
                'total_owed' => 0,
                'registration_status' => 'not_registered',
                'payment_pattern_status' => 'no_category',
                'consistency_status' => 'no_category'
            ];
        }

        // Check registration status
        $registration = $this->registrationTrack;
        $hasRegistered = !is_null($registration);
        
        if (!$hasRegistered) {
            return [
                'status' => 'not_registered',
                'message' => 'No open card has been deducted and you have not registered',
                'amount_owed' => 0,
                'months_owed' => 0,
                'total_owed' => 0,
                'registration_status' => 'not_registered',
                'monthly_amount' => $category->monthly_amount,
                'payment_pattern_status' => 'not_registered',
                'consistency_status' => 'not_registered'
            ];
        }

        try {
            // Calculate monthly amount (dailyMin * 30)
            $monthlyAmount = $category->dailyMin * 30;
            
            // Get registration date
            $registrationDate = Carbon::parse($registration->created_at);
            $currentDate = now();
            
            // Calculate expected months
            $expectedMonths = $this->calculateExpectedMonths($registrationDate, $currentDate);
            
            // Calculate amount expected to have paid
            $AETHP = $expectedMonths * $monthlyAmount;
            
            // Calculate amount paid since registration
            $amountPaid = $this->balances()
                ->whereIn('type', ['SHARES', 'SSAVINGS', 'SAVINGS', 'BUILDING'])
                ->where('created_at', '>=', $registrationDate->startOfDay())
                ->where('created_at', '<=', $currentDate->endOfDay())
                ->sum('debit');

            $APAID = (float) $amountPaid;

            // Calculate actual months owed
            $monthsOwed = 0;
            $isOwing = $AETHP > $APAID;
            $AmountOwing = $isOwing ? ($AETHP - $APAID) : 0;

            if ($isOwing && $monthlyAmount > 0) {
                $monthsOwed = ceil($AmountOwing / $monthlyAmount);
                // Ensure at least 1 month if owing anything
                $monthsOwed = max(1, $monthsOwed);
            }

            // Get current wallet balance
            $walletBalance = $this->wallet_balance;
            $canPayOwing = $walletBalance >= $AmountOwing;
            $remainingAfterOwing = $walletBalance - $AmountOwing;

            // Calculate both status types
            $paymentPatternStatus = $this->calculatePaymentPatternStatus(
                $registrationDate, 
                $currentDate, 
                $expectedMonths, 
                $monthsOwed,
                $amountPaid
            );

            $consistencyStatus = $this->calculateConsistencyStatus(
                $registrationDate, 
                $currentDate, 
                $expectedMonths, 
                $monthsOwed,
                $amountPaid
            );

            return [
                'status' => $isOwing ? 'owing' : 'up_to_date',
                'message' => $isOwing ? 
                    "Member is owing ₦" . number_format($AmountOwing, 2) . " for " . $monthsOwed . " month(s)" .
                    ($canPayOwing ? 
                        ". Can pay from wallet balance." : 
                        ". Insufficient wallet balance (₦" . number_format($walletBalance, 2) . ")") :
                    "Member is up-to-date with payments",
                'monthly_amount' => $monthlyAmount,
                'months_owed' => $monthsOwed,
                'total_owed' => $AmountOwing,
                'amount_expected_to_have_paid' => $AETHP,
                'amount_paid' => $APAID,
                'expected_months' => $expectedMonths,
                'registration_date' => $registrationDate->format('Y-m-d H:i:s'),
                'registration_status' => 'registered',
                'payment_pattern_status' => $paymentPatternStatus, // Make sure this is set
                'consistency_status' => $consistencyStatus,
                'category_details' => $category,
                'payment_status' => [
                    'is_owing' => $isOwing,
                    'can_pay' => $canPayOwing,
                    'wallet_balance' => $walletBalance,
                    'remaining_after_owing' => $remainingAfterOwing,
                ],
                'calculation_details' => [
                    'expected_months' => $expectedMonths,
                    'paid_months' => $monthlyAmount > 0 ? floor($APAID / $monthlyAmount) : 0,
                    'current_day' => $currentDate->day,
                    'registration_day' => $registrationDate->day,
                    'current_month' => $currentDate->format('Y-m'),
                    'registration_month' => $registrationDate->format('Y-m'),
                    'months_since_registration' => $registrationDate->diffInMonths($currentDate),
                ]
            ];

        } catch (\Exception $e) {
            \Log::error('Error calculating cooperative obligations for member ' . $this->id . ': ' . $e->getMessage());
            
            return [
                'status' => 'error',
                'message' => 'Error calculating obligations: ' . $e->getMessage(),
                'amount_owed' => 0,
                'months_owed' => 0,
                'total_owed' => 0,
                'registration_status' => 'unknown',
                'payment_pattern_status' => 'error',
                'consistency_status' => 'error'
            ];
        }
    }
    // private function calculateExpectedMonths(Carbon $registrationDate, Carbon $currentDate): int
    // {
    //     $registrationDay = $registrationDate->day;
    //     $currentDay = $currentDate->day;
        
    //     // If registered in current month
    //     if ($registrationDate->format('Y-m') === $currentDate->format('Y-m')) {
    //         // If registered after 28th, count from next month
    //         if ($registrationDay >= 28) {
    //             return 0;
    //         }
    //         // If registered before 28th and current day is after 28th, count current month
    //         if ($currentDay >= 28) {
    //             return 1;
    //         }
    //         return 0;
    //     }
        
    //     // For previous months registration
    //     $monthsDiff = $registrationDate->diffInMonths($currentDate);
        
    //     // Count months including adjustments for registration day and current day
    //     $expectedMonths = 0;
        
    //     // Start from registration month
    //     $month = $registrationDate->copy()->startOfMonth();
        
    //     while ($month <= $currentDate) {
    //         $monthStart = $month->copy()->startOfMonth();
    //         $monthEnd = $month->copy()->endOfMonth();
            
    //         // For registration month
    //         if ($month->format('Y-m') === $registrationDate->format('Y-m')) {
    //             if ($registrationDay < 28) {
    //                 $expectedMonths++;
    //             }
    //         }
    //         // For current month
    //         elseif ($month->format('Y-m') === $currentDate->format('Y-m')) {
    //             if ($currentDay >= 28) {
    //                 $expectedMonths++;
    //             }
    //         }
    //         // For months in between
    //         else {
    //             $expectedMonths++;
    //         }
            
    //         $month->addMonth();
    //     }
        
    //     return $expectedMonths;
    // }
    private function calculateExpectedMonths(Carbon $registrationDate, Carbon $currentDate): int
    {
        $registrationDay = $registrationDate->day;
        $currentDay = $currentDate->day;
        
        // Everyone starts owing from their registration month (28th cycle)
        $firstOwingMonth = $registrationDate->copy()->startOfMonth();
        
        // Determine the last month they owe
        $lastOwingMonth = $currentDate->copy()->startOfMonth();
        
        // If current day is before 28th, they haven't reached the next billing cycle
        if ($currentDate->day < 28) {
            $lastOwingMonth = $currentDate->copy()->subMonth()->startOfMonth();
        }
        
        if ($firstOwingMonth > $lastOwingMonth) {
            return 0;
        }
        
        return $firstOwingMonth->diffInMonths($lastOwingMonth) + 1;
    }
    /**
     * Calculate member consistency status
     */
    // private function calculateConsistencyStatus(
    //     Carbon $registrationDate, 
    //     Carbon $currentDate, 
    //     int $expectedMonths, 
    //     int $monthsOwed,
    //     float $amountPaid
    // ): string {
    //     if ($expectedMonths === 0) {
    //         return 'new_member';
    //     }
        
    //     $paymentRatio = $expectedMonths > 0 ? (($expectedMonths - $monthsOwed) / $expectedMonths) : 0;
        
    //     if ($monthsOwed === 0) {
    //         return 'very_consistent';
    //     } elseif ($monthsOwed <= 1 && $expectedMonths >= 3) {
    //         return 'consistent';
    //     } elseif ($monthsOwed <= 2 && $expectedMonths >= 6) {
    //         return 'moderately_consistent';
    //     } elseif ($paymentRatio >= 0.7) {
    //         return 'fairly_consistent';
    //     } else {
    //         return 'inconsistent';
    //     }
    // }
    /**
     * Calculate member consistency status
     */
    /**
     * Calculate payment pattern status (old consistency logic - renamed)
     */
    private function calculatePaymentPatternStatus(
        Carbon $registrationDate, 
        Carbon $currentDate, 
        int $expectedMonths, 
        int $monthsOwed,
        float $amountPaid
    ): string {
        if ($expectedMonths === 0) {
            return 'new_member';
        }
        
        $paidMonths = $expectedMonths - $monthsOwed;
        $paymentRatio = $expectedMonths > 0 ? ($paidMonths / $expectedMonths) * 100 : 0;
        
        if ($paymentRatio >= 90) {
            return 'excellent';
        } elseif ($paymentRatio >= 80) {
            return 'moderate';
        } elseif ($paymentRatio >= 70) {
            return 'fair';
        } elseif ($paymentRatio >= 50) {
            return 'poor';
        } else {
            return 'very_poor';
        }
    }

    /**
     * Calculate REAL consistency status based on perfect payment pattern using category month
     */
    private function calculateConsistencyStatus(
        Carbon $registrationDate, 
        Carbon $currentDate, 
        int $expectedMonths, 
        int $monthsOwed,
        float $amountPaid
    ): string {
        if ($expectedMonths === 0) {
            return 'new_member';
        }

        // Get the payment history for analysis
        $paymentHistory = $this->getPaymentHistory();
        
        if (empty($paymentHistory)) {
            return 'inconsistent';
        }

        // Calculate the required monthly amount from category
        $category = $this->categoryDetails;
        
        if (!$category) {
            return 'inconsistent';
        }

        $monthlyAmount = $category->monthly_amount;
        $requiredMonths = $category->month; // Get the required months from category (6 months)
        
        if ($monthlyAmount <= 0 || $requiredMonths <= 0) {
            return 'inconsistent';
        }

        // Check for perfect payment streak based on category months
        $currentPerfectStreak = 0;
        $maxPerfectStreak = 0;

        // Analyze payment history from most recent to oldest
        $recentPayments = array_slice($paymentHistory, -min($requiredMonths * 2, count($paymentHistory))); // Look at double the required months
        
        foreach (array_reverse($recentPayments) as $month) {
            // Check if payment was perfect (exact amount paid on time)
            $isPerfectPayment = $this->isPerfectPayment($month, $monthlyAmount);
            
            if ($isPerfectPayment) {
                $currentPerfectStreak++;
                $maxPerfectStreak = max($maxPerfectStreak, $currentPerfectStreak);
            } else {
                // Break the streak if payment is not perfect
                $currentPerfectStreak = 0;
            }
        }

        // Determine consistency status based on perfect payment streaks using category months
        if ($maxPerfectStreak >= $requiredMonths) {
            return 'very_consistent';
        } elseif ($maxPerfectStreak >= ceil($requiredMonths * 0.66)) { // ~4 months for 6-month requirement
            return 'moderately_consistent';
        } elseif ($maxPerfectStreak >= ceil($requiredMonths * 0.33)) { // ~2 months for 6-month requirement
            return 'fairly_consistent';
        } else {
            return 'inconsistent';
        }
    }

    /**
     * Get the current consistency streak in months based on category requirement
     */
    public function getCurrentConsistencyStreak(): array
    {
        $paymentHistory = $this->getPaymentHistory();
        $category = $this->categoryDetails;
        
        // Default values to prevent undefined array key errors
        $defaultResponse = [
            'current_streak' => 0,
            'perfect_payments' => [],
            'required_months' => 0,
            'needed_for_very_consistent' => 0,
            'progress_percentage' => 0,
            'category_name' => 'Unknown Category'
        ];
        
        if (!$category) {
            return $defaultResponse;
        }

        $monthlyAmount = $category->monthly_amount;
        $requiredMonths = $category->month; // Get from category (6 months)
        
        $currentStreak = 0;
        $perfectPayments = [];
        
        // Analyze from most recent to oldest
        $recentPayments = array_slice($paymentHistory, -min($requiredMonths * 2, count($paymentHistory)));
        
        foreach (array_reverse($recentPayments) as $month) {
            if ($this->isPerfectPayment($month, $monthlyAmount)) {
                $currentStreak++;
                $perfectPayments[] = $month;
            } else {
                break; // Streak broken
            }
        }

        $neededForVeryConsistent = max(0, $requiredMonths - $currentStreak);
        $progressPercentage = $requiredMonths > 0 ? min(100, ($currentStreak / $requiredMonths) * 100) : 0;
        
        return [
            'current_streak' => $currentStreak,
            'perfect_payments' => $perfectPayments,
            'required_months' => $requiredMonths,
            'needed_for_very_consistent' => $neededForVeryConsistent,
            'progress_percentage' => $progressPercentage,
            'category_name' => $category->name ?? 'Unknown Category', // Ensure category_name is always set
        ];
    }

    /**
     * Check if payment for a month was perfect (exact amount, on time)
     */
    private function isPerfectPayment(array $monthData, float $expectedAmount): bool
    {
        // Payment must be at least 95% of expected amount (allowing for small rounding differences)
        $amountThreshold = $expectedAmount * 0.95;
        
        // Check if paid the required amount (within 5% tolerance)
        $paidEnough = $monthData['paid_amount'] >= $amountThreshold;
        
        return $paidEnough && $monthData['is_paid'];
    }
    /**
     * Get payment history for consistency analysis
     */
    // public function getPaymentHistory()
    // {
    //     $registration = $this->registrationTrack;
    //     if (!$registration) {
    //         return [];
    //     }

    //     $registrationDate = Carbon::parse($registration->created_at);
    //     $currentDate = now();
        
    //     $paymentHistory = [];
    //     $month = $registrationDate->copy()->startOfMonth();
        
    //     while ($month <= $currentDate) {
    //         $monthStart = $month->copy()->startOfMonth();
    //         $monthEnd = $month->copy()->endOfMonth();
            
    //         // Skip registration month if registered after 28th
    //         if ($month->format('Y-m') === $registrationDate->format('Y-m') && $registrationDate->day >= 28) {
    //             $month->addMonth();
    //             continue;
    //         }
            
    //         // Skip current month if before 28th
    //         if ($month->format('Y-m') === $currentDate->format('Y-m') && $currentDate->day < 28) {
    //             $month->addMonth();
    //             continue;
    //         }
            
    //         $monthlyPayment = $this->balances()
    //             ->whereIn('type', ['SHARES', 'SSAVINGS', 'SAVINGS', 'BUILDING'])
    //             ->whereBetween('created_at', [$monthStart, $monthEnd])
    //             ->sum('debit');
            
    //         $category = $this->categoryDetails;
    //         $expectedAmount = $category ? $category->monthly_amount : 0;
    //         $isPaid = $monthlyPayment >= $expectedAmount * 0.8; // 80% threshold for considering as paid
            
    //         $paymentHistory[] = [
    //             'month' => $month->format('Y-m'),
    //             'month_name' => $month->format('F Y'),
    //             'expected_amount' => $expectedAmount,
    //             'paid_amount' => $monthlyPayment,
    //             'is_paid' => $isPaid,
    //             'payment_percentage' => $expectedAmount > 0 ? ($monthlyPayment / $expectedAmount) * 100 : 0,
    //         ];
            
    //         $month->addMonth();
    //     }
        
    //     return $paymentHistory;
    // }
    /**
     * Get payment history for consistency analysis
     */
    public function getPaymentHistory()
    {
        $registration = $this->registrationTrack;
        if (!$registration) {
            return [];
        }

        $registrationDate = Carbon::parse($registration->created_at);
        $currentDate = now();
        
        $paymentHistory = [];
        
        // Determine first month (always registration month)
        $month = $registrationDate->copy()->startOfMonth();
        
        // Determine last month based on current day
        $lastMonth = $currentDate->copy()->startOfMonth();
        if ($currentDate->day < 28) {
            $lastMonth = $currentDate->copy()->subMonth()->startOfMonth();
        }
        
        while ($month <= $lastMonth) {
            $monthStart = $month->copy()->startOfMonth();
            $monthEnd = $month->copy()->endOfMonth();
            
            $monthlyPayment = $this->balances()
                ->whereIn('type', ['SHARES', 'SSAVINGS', 'SAVINGS', 'BUILDING'])
                ->whereBetween('created_at', [$monthStart, $monthEnd])
                ->sum('debit');
            
            $category = $this->categoryDetails;
            $expectedAmount = $category ? $category->monthly_amount : 0;
            $isPaid = $monthlyPayment >= $expectedAmount * 0.8; // 80% threshold for considering as paid
            
            $paymentHistory[] = [
                'month' => $month->format('Y-m'),
                'month_name' => $month->format('F Y'),
                'expected_amount' => $expectedAmount,
                'paid_amount' => $monthlyPayment,
                'is_paid' => $isPaid,
                'payment_percentage' => $expectedAmount > 0 ? ($monthlyPayment / $expectedAmount) * 100 : 0,
            ];
            
            $month->addMonth();
        }
        
        return $paymentHistory;
    }
    /**
     * Get financial summary for cooperative view with consistency data
     */
    // public function getCooperativeFinancialSummary()
    // {
    //     $obligations = $this->getCooperativeObligations();
    //     $paymentHistory = $this->getPaymentHistory();
        
    //     return [
    //         'member' => [
    //             'id' => $this->id,
    //             'name' => $this->name,
    //             'mobile' => $this->mobile,
    //             'category' => $this->category,
    //             'nstatus' => $this->nstatus,
    //         ],
    //         'obligations' => $obligations,
    //         'balances' => [
    //             'SHARES' => $this->total_shares,
    //             'SAVINGS' => $this->total_savings,
    //             'SSAVINGS' => $this->balances->where('type', 'SSAVINGS')->sum('debit') - 
    //                         $this->balances->where('type', 'SSAVINGS')->sum('credit'),
    //             'WALLET' => $this->wallet_balance,
    //             'BUILDING' => $this->balances->where('type', 'BUILDING')->sum('debit') - 
    //                 $this->balances->where('type', 'BUILDING')->sum('credit'),
    //         ],
    //         'total_assets' => $this->total_shares + $this->total_savings + $this->wallet_balance + 
    //                         ($this->balances->where('type', 'SSAVINGS')->sum('debit') - 
    //                         $this->balances->where('type', 'SSAVINGS')->sum('credit')),
    //         'consistency' => [
    //             'status' => $obligations['consistency_status'],
    //             'payment_history' => $paymentHistory,
    //             'total_months' => count($paymentHistory),
    //             'paid_months' => count(array_filter($paymentHistory, function($month) {
    //                 return $month['is_paid'];
    //             })),
    //             'completion_rate' => count($paymentHistory) > 0 ? 
    //                 (count(array_filter($paymentHistory, function($month) {
    //                     return $month['is_paid'];
    //                 })) / count($paymentHistory)) * 100 : 0,
    //         ]
    //     ];
    // }
    /**
     * Get financial summary for cooperative view with consistency data (old logic)
     */
    // public function getCooperativeFinancialSummary()
    // {
    //     $obligations = $this->getCooperativeObligations();
    //     $paymentHistory = $this->getPaymentHistory();
        
    //     // Calculate consistency metrics safely
    //     $expectedMonths = $obligations['expected_months'] ?? 0;
    //     $monthsOwed = $obligations['months_owed'] ?? 0;
    //     $paidMonths = $expectedMonths - $monthsOwed;
    //     $completionRate = $expectedMonths > 0 ? ($paidMonths / $expectedMonths) * 100 : 0;
        
    //     return [
    //         'member' => [
    //             'id' => $this->id,
    //             'name' => $this->name,
    //             'mobile' => $this->mobile,
    //             'category' => $this->category,
    //             'nstatus' => $this->nstatus,
    //         ],
    //         'obligations' => $obligations,
    //         'balances' => [
    //             'SHARES' => $this->total_shares,
    //             'SAVINGS' => $this->total_savings,
    //             'SSAVINGS' => $this->balances->where('type', 'SSAVINGS')->sum('debit') - 
    //                         $this->balances->where('type', 'SSAVINGS')->sum('credit'),
    //             'WALLET' => $this->wallet_balance,
    //             'BUILDING' => $this->balances->where('type', 'BUILDING')->sum('debit') - 
    //                 $this->balances->where('type', 'BUILDING')->sum('credit'),
    //         ],
    //         'total_assets' => $this->total_shares + $this->total_savings + $this->wallet_balance + 
    //                         ($this->balances->where('type', 'SSAVINGS')->sum('debit') - 
    //                         $this->balances->where('type', 'SSAVINGS')->sum('credit')),
    //         'consistency' => [
    //             'status' => $obligations['consistency_status'] ?? 'unknown',
    //             'payment_history' => $paymentHistory,
    //             'total_months' => $expectedMonths,
    //             'paid_months' => $paidMonths,
    //             'owed_months' => $monthsOwed,
    //             'completion_rate' => $completionRate,
    //         ]
    //     ];
    // }

    // (new logic)
    public function getCooperativeFinancialSummary()
    {
        $obligations = $this->getCooperativeObligations();
        $paymentHistory = $this->getPaymentHistory();
        $consistencyStreak = $this->getCurrentConsistencyStreak();
        
        // Calculate consistency metrics safely
        $expectedMonths = $obligations['expected_months'] ?? 0;
        $monthsOwed = $obligations['months_owed'] ?? 0;
        $paidMonths = $expectedMonths - $monthsOwed;
        $completionRate = $expectedMonths > 0 ? ($paidMonths / $expectedMonths) * 100 : 0;
        
        // Ensure all consistency fields are set with defaults
        $consistencyData = [
            'status' => $obligations['consistency_status'] ?? 'unknown',
            'current_streak' => $consistencyStreak['current_streak'] ?? 0,
            'required_months' => $consistencyStreak['required_months'] ?? 0,
            'needed_for_very_consistent' => $consistencyStreak['needed_for_very_consistent'] ?? 0,
            'progress_percentage' => $consistencyStreak['progress_percentage'] ?? 0,
            'perfect_payments_count' => count($consistencyStreak['perfect_payments'] ?? []),
            'category_name' => $consistencyStreak['category_name'] ?? 'Unknown Category',
        ];
        
        return [
            'member' => [
                'id' => $this->id,
                'name' => $this->name,
                'mobile' => $this->mobile,
                'category' => $this->category,
                'nstatus' => $this->nstatus,
            ],
            'obligations' => $obligations,
            'balances' => [
                'SHARES' => $this->total_shares,
                'SAVINGS' => $this->total_savings,
                'SSAVINGS' => $this->balances->where('type', 'SSAVINGS')->sum('debit') - 
                            $this->balances->where('type', 'SSAVINGS')->sum('credit'),
                'WALLET' => $this->wallet_balance,
                'BUILDING' => $this->balances->where('type', 'BUILDING')->sum('debit') - 
                    $this->balances->where('type', 'BUILDING')->sum('credit'),
            ],
            'total_assets' => $this->total_shares + $this->total_savings + $this->wallet_balance + 
                            ($this->balances->where('type', 'SSAVINGS')->sum('debit') - 
                            $this->balances->where('type', 'SSAVINGS')->sum('credit')),
            'payment_pattern' => [
                'status' => $obligations['payment_pattern_status'] ?? 'unknown',
                'payment_history' => $paymentHistory,
                'total_months' => $expectedMonths,
                'paid_months' => $paidMonths,
                'owed_months' => $monthsOwed,
                'completion_rate' => $completionRate,
            ],
            'consistency' => $consistencyData
        ];
    }
    /**
     * Get active contribution plans
     */
    public function activeContributionPlans()
    {
        return $this->hasMany(ContributionPlan::class, 'mobile', 'mobile')
                    ->where('status', 'ACTIVE');
    }

    /**
     * Get completed contribution plans
     */
    public function completedContributionPlans()
    {
        return $this->hasMany(ContributionPlan::class, 'mobile', 'mobile')
                    ->where('status', 'COMPLETED');
    }

    /**
     * Get all contribution plans
     */
    public function contributionPlans()
    {
        return $this->hasMany(ContributionPlan::class, 'mobile', 'mobile');
    }

    /**
     * Check if member has any active contribution plans
     */
    public function getHasActiveContributionPlansAttribute()
    {
        return $this->activeContributionPlans()->exists();
    }

    /**
     * Get contribution plan summary
     */
    public function getContributionPlanSummary()
    {
        $activePlans = $this->activeContributionPlans;
        $completedPlans = $this->completedContributionPlans;

        $totalActiveAmount = $activePlans->sum('amount');
        $totalCompletedAmount = $completedPlans->sum('amount');
        $totalContributions = $this->ajoContributions()->sum('amount');

        return [
            'active_plans_count' => $activePlans->count(),
            'completed_plans_count' => $completedPlans->count(),
            'total_active_amount' => $totalActiveAmount,
            'total_completed_amount' => $totalCompletedAmount,
            'total_contributions' => $totalContributions,
            'active_plans' => $activePlans->map(function($plan) {
                return [
                    'id' => $plan->id,
                    'amount' => $plan->amount,
                    'frequency' => $plan->frequency,
                    'total_contributions' => $plan->total_contributions,
                    'remaining_amount' => $plan->remaining_amount,
                    'completion_percentage' => $plan->completion_percentage,
                    'start_date' => $plan->start_date?->format('Y-m-d'),
                    'end_date' => $plan->end_date?->format('Y-m-d'),
                ];
            }),
            'has_active_plans' => $activePlans->count() > 0,
        ];
    }
    public function getTotalAjoContributionsAttribute()
    {
        return $this->balances()
            ->where('type', 'AJO')
            ->sum('debit') - $this->balances()
            ->where('type', 'AJO')
            ->sum('credit');
    }

    /**
     * Get AJO contribution transactions
     */
    public function ajoBalanceTransactions()
    {
        return $this->balances()
            ->where('type', 'AJO')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get AJO contributions summary
     */
    public function getAjoContributionSummary()
    {
        $totalDebit = $this->balances()->where('type', 'AJO')->sum('debit');
        $totalCredit = $this->balances()->where('type', 'AJO')->sum('credit');
        $netAmount = $totalDebit - $totalCredit;

        return [
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit,
            'net_amount' => $netAmount,
            'transactions' => $this->ajoBalanceTransactions()
        ];
    }
    public function ajoGroupMemberships()
    {
        return $this->hasMany(AjoMember::class, 'mobile', 'mobile');
    }

    /**
     * Get group contributions
     */
    public function ajoGroupContributions()
    {
        return $this->hasMany(AjoContribution::class, 'mobile', 'mobile');
    }

    /**
     * Get group payouts received
     */
    public function ajoGroupPayouts()
    {
        return $this->hasMany(AjoPayout::class, 'receiver_mobile', 'mobile');
    }

    /**
     * Get group AJO summary
     */
    public function getGroupAjoSummary()
    {
        $allMemberships = $this->ajoGroupMemberships()->with('group')->get();

        $totalGroupContributions = $this->ajoGroupContributions()->sum('amount');
        $totalGroupPayouts = $this->ajoGroupPayouts()->sum('amount');

        return [
            'total_groups_count' => $allMemberships->count(),
            'total_group_contributions' => $totalGroupContributions,
            'total_group_payouts' => $totalGroupPayouts,
            'net_group_position' => $totalGroupContributions - $totalGroupPayouts,
            'groups' => $allMemberships->map(function($membership) {
                $group = $membership->group;
                return [
                    'group_id' => $group->id,
                    'group_name' => $group->group_name,
                    'amount' => $group->amount,
                    'interval_type' => $group->interval_type,
                    'current_round' => $group->current_round,
                    'status' => $group->status,
                    'joined_at' => $membership->joined_at?->format('Y-m-d H:i:s'),
                    'has_received' => $membership->has_received,
                    'total_contributions' => $membership->total_contributions,
                    'total_payouts' => $membership->total_payouts,
                    'net_position' => $membership->net_position,
                ];
            }),
            'has_groups' => $allMemberships->count() > 0,
        ];
    }
}