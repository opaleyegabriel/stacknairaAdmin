<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\Balance;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class AccumulationPassbookController extends Controller
{
    /**
     * Display accumulation passbook for all members
     */
    public function index(Request $request)
    {
        $query = Member::with(['categoryDetails', 'registrationTrack']);

        // Search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('mobile', 'like', "%{$search}%");
            });
        }

        // Category filter
        $categoryFilter = $request->input('category');
        if ($categoryFilter && $categoryFilter !== 'all') {
            $query->where('category', $categoryFilter);
        }

        // Status filter
        $statusFilter = $request->input('status');
        if ($statusFilter === 'active') {
            $query->active();
        } elseif ($statusFilter === 'inactive') {
            $query->where('nstatus', 0);
        }

        $members = $query->orderBy('name')
                        ->paginate(20);

        $categories = Category::all();

        return Inertia::render('AccumulationPassbook/Index', [
            'members' => $members,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'status'])
        ]);
    }

    public function show($id, Request $request)
    {
        try {
            $member = Member::with(['categoryDetails', 'registrationTrack'])->findOrFail($id);
            
            // Get member's category and monthly target
            $category = $member->categoryDetails;
            if (!$category) {
                return Inertia::render('AccumulationPassbook/Show', [
                    'member' => $member,
                    'error' => 'This member has no category assigned. Please assign a category first.',
                    'canView' => false
                ]);
            }

            $monthlyTarget = $category->dailyMin * 30;

            // Get registration date
            $registrationDate = $member->registrationTrack?->created_at;
            if (!$registrationDate) {
                return Inertia::render('AccumulationPassbook/Show', [
                    'member' => $member,
                    'error' => 'This member is not registered yet. Registration is required to track payments.',
                    'canView' => false
                ]);
            }

            // Get ALL payments since registration
            $allPayments = Balance::where('mobile', $member->mobile)
                ->whereIn('type', ['SHARES', 'SSAVINGS', 'SAVINGS', 'BUILDING'])
                ->where('debit', '>', 0)
                ->where('created_at', '>=', $registrationDate)
                ->orderBy('created_at', 'asc')
                ->get();

            // Generate passbook with accumulation logic
            $passbookData = $this->generateAccumulationPassbook(
                $allPayments, 
                $member, 
                $monthlyTarget, 
                $registrationDate
            );

            return Inertia::render('AccumulationPassbook/Show', [
                'member' => $member,
                'passbookEntries' => $passbookData['entries'],
                'finalBalances' => $passbookData['final_balances'],
                'summary' => $passbookData['summary'],
                'category' => $category,
                'monthlyTarget' => $monthlyTarget,
                'canView' => true
            ]);

        } catch (\Exception $e) {
            \Log::error('Error loading accumulation passbook for member ' . $id . ': ' . $e->getMessage());
            
            return Inertia::render('AccumulationPassbook/Show', [
                'error' => 'An error occurred while loading the accumulation passbook: ' . $e->getMessage(),
                'canView' => false
            ]);
        }
    }

    /**
     * Generate accumulation passbook with same structure as regular passbook
     */
    // private function generateAccumulationPassbook($allPayments, $member, $monthlyTarget, $registrationDate)
    // {
    //     $entries = [];
    //     $summary = [
    //         'total_payments' => 0,
    //         'months_fulfilled' => 0,
    //         'months_owing' => 0,
    //         'total_owed' => 0
    //     ];

    //     // Total payments available
    //     $totalPayments = $allPayments->sum('debit');
    //     $summary['total_payments'] = $totalPayments;

    //     // Calculate expected months
    //     $registration = Carbon::parse($registrationDate);
    //     $currentDate = now();
    //     $expectedMonths = $this->calculateExpectedMonths($registration, $currentDate);
        
    //     // Calculate total amount expected and owed
    //     $totalExpected = $expectedMonths * $monthlyTarget;
    //     $amountPaid = $this->calculateAmountPaid($member, $registrationDate, $currentDate);
    //     $totalOwed = max(0, $totalExpected - $amountPaid);
    //     $monthsOwed = $monthlyTarget > 0 ? ceil($totalOwed / $monthlyTarget) : 0;
        
    //     $summary['months_owing'] = $monthsOwed;
    //     $summary['total_owed'] = $totalOwed;

    //     // Initialize running balances for each account type
    //     $runningBalances = [
    //         'SHARES' => 0,
    //         'SAVINGS' => 0,
    //         'SSAVINGS' => 0,
    //         'BUILDING' => 0,
    //         'LOAN_INTEREST' => 0
    //     ];

    //     // Add opening balance entry
    //     $entries[] = [
    //         'month_year' => $registration->format('Y-m'),
    //         'month_name' => 'OPENING BALANCE',
    //         'date_display' => $registration->format('d/m/Y'),
    //         'shares_dr' => 0,
    //         'shares_cr' => 0,
    //         'shares_balance' => 0,
    //         'savings_dr' => 0,
    //         'savings_cr' => 0,
    //         'savings_balance' => 0,
    //         'special_savings_dr' => 0,
    //         'special_savings_cr' => 0,
    //         'special_savings_balance' => 0,
    //         'building_dr' => 0,
    //         'building_cr' => 0,
    //         'building_balance' => 0,
    //         'loan_interest_dr' => 0,
    //         'loan_interest_cr' => 0,
    //         'loan_interest_balance' => 0,
    //         'monthly_total' => 0,
    //         'final_balance' => 0,
    //         'is_opening_balance' => true,
    //         'is_accumulation_stop' => false
    //     ];

    //     // Allocate payments to months in sequence, STOPPING at first unpaid month
    //     $remainingPayments = $totalPayments;
    //     $currentMonth = $registration->copy()->startOfMonth();
    //     $monthsProcessed = 0;
    //     $hasUnpaidMonth = false;

    //     while ($currentMonth <= $currentDate && $monthsProcessed < $expectedMonths && !$hasUnpaidMonth) {
    //         $monthYear = $currentMonth->format('Y-m');
    //         $monthName = $currentMonth->format('F Y');
            
    //         // Calculate allocation for this month
    //         $allocation = min($monthlyTarget, $remainingPayments);
    //         $isFulfilled = $allocation >= $monthlyTarget;
    //         $shortfall = $monthlyTarget - $allocation;
            
    //         // If this month is not fulfilled, mark it as the stopping point
    //         if (!$isFulfilled) {
    //             $hasUnpaidMonth = true;
    //         }

    //         // Update running balances (simulate allocation to different accounts)
    //         // In accumulation, we distribute the allocation across account types
    //         $sharesAllocation = $allocation * 0.4; // 40% to shares
    //         $savingsAllocation = $allocation * 0.3; // 30% to savings
    //         $specialSavingsAllocation = $allocation * 0.2; // 20% to special savings
    //         $buildingAllocation = $allocation * 0.1; // 10% to building

    //         // Update running balances
    //         $runningBalances['SHARES'] += $sharesAllocation;
    //         $runningBalances['SAVINGS'] += $savingsAllocation;
    //         $runningBalances['SSAVINGS'] += $specialSavingsAllocation;
    //         $runningBalances['BUILDING'] += $buildingAllocation;

    //         $finalBalance = array_sum($runningBalances);

    //         $entries[] = [
    //             'month_year' => $monthYear,
    //             'month_name' => $monthName,
    //             'date_display' => $currentMonth->format('d/m/Y'),
    //             'shares_dr' => $sharesAllocation,
    //             'shares_cr' => 0,
    //             'shares_balance' => $runningBalances['SHARES'],
    //             'savings_dr' => $savingsAllocation,
    //             'savings_cr' => 0,
    //             'savings_balance' => $runningBalances['SAVINGS'],
    //             'special_savings_dr' => $specialSavingsAllocation,
    //             'special_savings_cr' => 0,
    //             'special_savings_balance' => $runningBalances['SSAVINGS'],
    //             'building_dr' => $buildingAllocation,
    //             'building_cr' => 0,
    //             'building_balance' => $runningBalances['BUILDING'],
    //             'loan_interest_dr' => 0,
    //             'loan_interest_cr' => 0,
    //             'loan_interest_balance' => $runningBalances['LOAN_INTEREST'],
    //             'monthly_total' => $allocation,
    //             'final_balance' => $finalBalance,
    //             'is_opening_balance' => false,
    //             'is_accumulation_stop' => !$isFulfilled, // Mark if this is where we stop
    //             'allocation_details' => [
    //                 'allocated_amount' => $allocation,
    //                 'is_fulfilled' => $isFulfilled,
    //                 'shortfall' => $shortfall,
    //                 'remaining_payments' => $remainingPayments - $allocation
    //             ]
    //         ];

    //         $remainingPayments -= $allocation;
    //         $currentMonth->addMonth();
    //         $monthsProcessed++;

    //         if ($isFulfilled) {
    //             $summary['months_fulfilled']++;
    //         }
    //     }

    //     return [
    //         'entries' => $entries,
    //         'final_balances' => $runningBalances,
    //         'summary' => $summary
    //     ];
    // }
private function generateAccumulationPassbook($allPayments, $member, $monthlyTarget, $registrationDate)
{
    $entries = [];
    $summary = [
        'total_payments' => 0,
        'months_fulfilled' => 0,
        'months_owing' => 0,
        'total_owed' => 0
    ];

    // Total payments available
    $totalPayments = $allPayments->sum('debit');
    $summary['total_payments'] = $totalPayments;

    // Calculate expected months
    $registration = Carbon::parse($registrationDate);
    $currentDate = now();
    $expectedMonths = $this->calculateExpectedMonths($registration, $currentDate);
    
    // Calculate total amount expected and owed
    $totalExpected = $expectedMonths * $monthlyTarget;
    $amountPaid = $this->calculateAmountPaid($member, $registrationDate, $currentDate);
    $totalOwed = max(0, $totalExpected - $amountPaid);
    $monthsOwed = $monthlyTarget > 0 ? ceil($totalOwed / $monthlyTarget) : 0;
    
    $summary['months_owing'] = $monthsOwed;
    $summary['total_owed'] = $totalOwed;

    // Get member's actual allocations from database
    $memberSetups = $this->getMemberSetups($member);
    
    // Initialize running balances for each account type
    $runningBalances = [
        'SHARES' => 0,
        'SAVINGS' => 0,
        'SSAVINGS' => 0,
        'BUILDING' => 0,
        'LOAN_INTEREST' => 0
    ];

    // Add opening balance entry
    $entries[] = [
        'month_year' => $registration->format('Y-m'),
        'month_name' => 'OPENING BALANCE',
        'date_display' => $registration->format('d/m/Y'),
        'shares_dr' => 0,
        'shares_cr' => 0,
        'shares_balance' => 0,
        'savings_dr' => 0,
        'savings_cr' => 0,
        'savings_balance' => 0,
        'special_savings_dr' => 0,
        'special_savings_cr' => 0,
        'special_savings_balance' => 0,
        'building_dr' => 0,
        'building_cr' => 0,
        'building_balance' => 0,
        'loan_interest_dr' => 0,
        'loan_interest_cr' => 0,
        'loan_interest_balance' => 0,
        'monthly_total' => 0,
        'final_balance' => 0,
        'is_opening_balance' => true,
        'is_accumulation_stop' => false
    ];

    // Allocate payments to months in sequence, STOPPING at first unpaid month
    $remainingPayments = $totalPayments;
    $currentMonth = $registration->copy()->startOfMonth();
    $monthsProcessed = 0;
    $hasUnpaidMonth = false;

    while ($currentMonth <= $currentDate && $monthsProcessed < $expectedMonths && !$hasUnpaidMonth) {
        $monthYear = $currentMonth->format('Y-m');
        $monthName = $currentMonth->format('F Y');
        
        // Calculate allocation for this month
        $allocation = min($monthlyTarget, $remainingPayments);
        $isFulfilled = $allocation >= $monthlyTarget;
        $shortfall = $monthlyTarget - $allocation;
        
        // If this month is not fulfilled, mark it as the stopping point
        if (!$isFulfilled) {
            $hasUnpaidMonth = true;
        }

        // Calculate allocations based on member's actual database percentages
        $allocations = $this->calculateMonthlyAllocations($allocation, $memberSetups);

        // Update running balances
        $runningBalances['SHARES'] += $allocations['SHARES'];
        $runningBalances['SAVINGS'] += $allocations['SAVINGS'];
        $runningBalances['SSAVINGS'] += $allocations['SSAVINGS'];
        $runningBalances['BUILDING'] += $allocations['BUILDING'];

        $finalBalance = array_sum($runningBalances);

        $entries[] = [
            'month_year' => $monthYear,
            'month_name' => $monthName,
            'date_display' => $currentMonth->format('d/m/Y'),
            'shares_dr' => $allocations['SHARES'],
            'shares_cr' => 0,
            'shares_balance' => $runningBalances['SHARES'],
            'savings_dr' => $allocations['SAVINGS'],
            'savings_cr' => 0,
            'savings_balance' => $runningBalances['SAVINGS'],
            'special_savings_dr' => $allocations['SSAVINGS'],
            'special_savings_cr' => 0,
            'special_savings_balance' => $runningBalances['SSAVINGS'],
            'building_dr' => $allocations['BUILDING'],
            'building_cr' => 0,
            'building_balance' => $runningBalances['BUILDING'],
            'loan_interest_dr' => 0,
            'loan_interest_cr' => 0,
            'loan_interest_balance' => $runningBalances['LOAN_INTEREST'],
            'monthly_total' => $allocation,
            'final_balance' => $finalBalance,
            'is_opening_balance' => false,
            'is_accumulation_stop' => !$isFulfilled,
            'allocation_details' => [
                'allocated_amount' => $allocation,
                'is_fulfilled' => $isFulfilled,
                'shortfall' => $shortfall,
                'remaining_payments' => $remainingPayments - $allocation
            ]
        ];

        $remainingPayments -= $allocation;
        $currentMonth->addMonth();
        $monthsProcessed++;

        if ($isFulfilled) {
            $summary['months_fulfilled']++;
        }
    }

    return [
        'entries' => $entries,
        'final_balances' => $runningBalances,
        'summary' => $summary
    ];
}

/**
 * Get member's allocation setups from database
 */
private function getMemberSetups($member)
{
    $setups = [
        'SHARES' => 0,
        'SAVINGS' => 0,
        'SSAVINGS' => 0,
        'BUILDING' => 0
    ];

    try {
        // Get setups from database using the correct table and column names
        $memberSetups = \DB::table('member_setup')
            ->where('mobile', $member->mobile)
            ->whereIn('type', ['SHARES', 'SAVINGS', 'SSAVINGS', 'BUILDING'])
            ->get();

        foreach ($memberSetups as $setup) {
            $setups[$setup->type] = (float) $setup->pcent;
        }

        // Log the setups for debugging
        \Log::info("Member setups for {$member->mobile}:", $setups);

    } catch (\Exception $e) {
        \Log::error("Error getting member setups for {$member->mobile}: " . $e->getMessage());
    }

    return $setups;
}

/**
 * Calculate monthly allocations based on member's actual database percentages
 */
private function calculateMonthlyAllocations($allocation, $setups)
{
    $allocations = [
        'SHARES' => 0,
        'SAVINGS' => 0,
        'SSAVINGS' => 0,
        'BUILDING' => 0
    ];

    // Step 1: Allocate building fund (fixed amount ₦200)
    $buildingAllocation = min($setups['BUILDING'], $allocation);
    $allocations['BUILDING'] = $buildingAllocation;
    $remainingAfterBuilding = $allocation - $buildingAllocation;

    // Step 2: Allocate percentage-based amounts using actual database percentages
    if ($remainingAfterBuilding > 0) {
        // Use the actual percentages from database
        $sharesPercentage = $setups['SHARES']; // Should be 7.69
        $specialSavingsPercentage = $setups['SSAVINGS']; // Should be 40.00
        
        // Calculate allocations based on actual percentages
        $allocations['SHARES'] = $remainingAfterBuilding * ($sharesPercentage / 100);
        $allocations['SSAVINGS'] = $remainingAfterBuilding * ($specialSavingsPercentage / 100);
        
        // Calculate what's allocated so far
        $allocatedSoFar = $buildingAllocation + $allocations['SHARES'] + $allocations['SSAVINGS'];
        
        // Put any remaining amount into SAVINGS (excess goes here)
        $allocations['SAVINGS'] = $allocation - $allocatedSoFar;
        
        // Ensure no negative values due to rounding
        if ($allocations['SAVINGS'] < 0) {
            $allocations['SAVINGS'] = 0;
        }
    } else {
        // If allocation is less than building fund, building gets everything
        $allocations['BUILDING'] = $allocation;
    }

    return $allocations;
}

    private function calculateExpectedMonths(Carbon $registrationDate, Carbon $currentDate): int
    {
        $registrationDay = $registrationDate->day;
        $currentDay = $currentDate->day;
        
        $firstOwingMonth = $registrationDate->copy()->startOfMonth();
        $lastOwingMonth = $currentDate->copy()->startOfMonth();
        
        if ($currentDate->day < 28) {
            $lastOwingMonth = $currentDate->copy()->subMonth()->startOfMonth();
        }
        
        if ($firstOwingMonth > $lastOwingMonth) {
            return 0;
        }
        
        return $firstOwingMonth->diffInMonths($lastOwingMonth) + 1;
    }

    private function calculateAmountPaid($member, $registrationDate, $currentDate)
    {
        return $member->balances()
            ->whereIn('type', ['SHARES', 'SSAVINGS', 'SAVINGS', 'BUILDING'])
            ->where('created_at', '>=', $registrationDate)
            ->where('created_at', '<=', $currentDate)
            ->sum('debit');
    }
    public function exportPdf($id, Request $request)
    {
        try {
            $member = Member::with(['categoryDetails', 'registrationTrack'])->findOrFail($id);
            
            // Get member's category and monthly target
            $category = $member->categoryDetails;
            if (!$category) {
                return response()->json(['error' => 'Member has no category assigned'], 400);
            }

            $monthlyTarget = $category->dailyMin * 30;

            // Get registration date
            $registrationDate = $member->registrationTrack?->created_at;
            if (!$registrationDate) {
                return response()->json(['error' => 'Member is not registered'], 400);
            }

            // Get ALL payments since registration
            $allPayments = Balance::where('mobile', $member->mobile)
                ->whereIn('type', ['SHARES', 'SSAVINGS', 'SAVINGS', 'BUILDING'])
                ->where('debit', '>', 0)
                ->where('created_at', '>=', $registrationDate)
                ->orderBy('created_at', 'asc')
                ->get();

            // Generate passbook data
            $passbookData = $this->generateAccumulationPassbook(
                $allPayments, 
                $member, 
                $monthlyTarget, 
                $registrationDate
            );

            // Prepare data for PDF
            $data = [
                'member' => $member,
                'passbookEntries' => $passbookData['entries'],
                'finalBalances' => $passbookData['final_balances'],
                'summary' => $passbookData['summary'],
                'category' => $category,
                'monthlyTarget' => $monthlyTarget,
                'generated_date' => now()->format('d/m/Y H:i:s'),
                'totalYearlyAmount' => collect($passbookData['entries'])
                    ->filter(fn($entry) => !isset($entry['is_opening_balance']))
                    ->sum('monthly_total')
            ];

            $pdf = Pdf::loadView('pdf.accumulation-passbook', $data);
            
            $filename = "accumulation_passbook_{$member->name}_" . now()->format('Ymd_His') . ".pdf";
            
            return $pdf->download($filename);

        } catch (\Exception $e) {
            \Log::error('Error exporting accumulation passbook PDF for member ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }
}