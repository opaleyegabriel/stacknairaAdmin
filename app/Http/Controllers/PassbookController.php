<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\Balance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class PassbookController extends Controller
{
    /**
     * Display passbook listing for all members
     */
    public function index(Request $request)
    {
        $query = Member::with(['categoryDetails']);

        // Search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('mobile', 'like', "%{$search}%");
            });
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

        return Inertia::render('Passbook/Index', [
            'members' => $members,
            'filters' => $request->only(['search', 'status'])
        ]);
    }

    /**
     * Display passbook for a specific member - MONTHLY TOTALS
     */
       public function show($id, Request $request)
    {
        $member = Member::with(['categoryDetails'])->findOrFail($id);
        
        $year = $request->input('year', date('Y'));
        
        // Get monthly totals for all account types
        $monthlyTotals = Balance::where('mobile', $member->mobile)
            ->whereYear('created_at', $year)
            ->selectRaw('
                YEAR(created_at) as year,
                MONTH(created_at) as month,
                DATE_FORMAT(created_at, "%Y-%m") as month_year,
                DATE_FORMAT(created_at, "%M %Y") as month_name,
                SUM(CASE WHEN type = "SHARES" THEN debit ELSE 0 END) as shares_dr,
                SUM(CASE WHEN type = "SHARES" THEN credit ELSE 0 END) as shares_cr,
                SUM(CASE WHEN type = "SAVINGS" THEN debit ELSE 0 END) as savings_dr,
                SUM(CASE WHEN type = "SAVINGS" THEN credit ELSE 0 END) as savings_cr,
                SUM(CASE WHEN type = "SSAVINGS" THEN debit ELSE 0 END) as special_savings_dr,
                SUM(CASE WHEN type = "SSAVINGS" THEN credit ELSE 0 END) as special_savings_cr,
                SUM(CASE WHEN type = "BUILDING" THEN debit ELSE 0 END) as building_dr,
                SUM(CASE WHEN type = "BUILDING" THEN credit ELSE 0 END) as building_cr,
                SUM(CASE WHEN type = "LOAN_INTEREST" THEN debit ELSE 0 END) as loan_interest_dr,
                SUM(CASE WHEN type = "LOAN_INTEREST" THEN credit ELSE 0 END) as loan_interest_cr
            ')
            ->groupBy('year', 'month', 'month_year', 'month_name')
            ->orderBy('year', 'asc')
            ->orderBy('month', 'asc')
            ->get();

        // Calculate running balances and monthly totals
        $passbookData = $this->calculatePassbookData($monthlyTotals, $member, $year);
        
        // Get available years for filter
        $availableYears = Balance::where('mobile', $member->mobile)
            ->selectRaw('YEAR(created_at) as year')
            ->distinct()
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->toArray();

        return Inertia::render('Passbook/Show', [
            'member' => $member,
            'passbookEntries' => $passbookData['entries'],
            'finalBalances' => $passbookData['final_balances'],
            'availableYears' => $availableYears,
            'filters' => [
                'year' => (int)$year
            ]
        ]);
    }

    
    /**
     * Export passbook as PDF
     */
    public function exportPdf($id, Request $request)
    {
        $member = Member::with(['categoryDetails'])->findOrFail($id);
        $year = $request->input('year', date('Y'));
        
        // Get the same data as show method
        $monthlyTotals = Balance::where('mobile', $member->mobile)
            ->whereYear('created_at', $year)
            ->selectRaw('
                YEAR(created_at) as year,
                MONTH(created_at) as month,
                DATE_FORMAT(created_at, "%Y-%m") as month_year,
                DATE_FORMAT(created_at, "%M %Y") as month_name,
                SUM(CASE WHEN type = "SHARES" THEN debit ELSE 0 END) as shares_dr,
                SUM(CASE WHEN type = "SHARES" THEN credit ELSE 0 END) as shares_cr,
                SUM(CASE WHEN type = "SAVINGS" THEN debit ELSE 0 END) as savings_dr,
                SUM(CASE WHEN type = "SAVINGS" THEN credit ELSE 0 END) as savings_cr,
                SUM(CASE WHEN type = "SSAVINGS" THEN debit ELSE 0 END) as special_savings_dr,
                SUM(CASE WHEN type = "SSAVINGS" THEN credit ELSE 0 END) as special_savings_cr,
                SUM(CASE WHEN type = "BUILDING" THEN debit ELSE 0 END) as building_dr,
                SUM(CASE WHEN type = "BUILDING" THEN credit ELSE 0 END) as building_cr,
                SUM(CASE WHEN type = "LOAN_INTEREST" THEN debit ELSE 0 END) as loan_interest_dr,
                SUM(CASE WHEN type = "LOAN_INTEREST" THEN credit ELSE 0 END) as loan_interest_cr
            ')
            ->groupBy('year', 'month', 'month_year', 'month_name')
            ->orderBy('year', 'asc')
            ->orderBy('month', 'asc')
            ->get();

        $passbookData = $this->calculatePassbookData($monthlyTotals, $member, $year);

        // Calculate total yearly amount
        $totalYearlyAmount = collect($passbookData['entries'])
            ->filter(fn($entry) => !isset($entry['is_opening_balance']))
            ->sum('monthly_total');

        $data = [
            'member' => $member,
            'entries' => $passbookData['entries'],
            'final_balances' => $passbookData['final_balances'],
            'year' => $year,
            'total_yearly_amount' => $totalYearlyAmount,
            'generated_date' => now()->format('d/m/Y H:i:s'),
        ];

        $pdf = Pdf::loadView('pdf.passbook', $data);
        
        $filename = "passbook_{$member->name}_{$year}_" . now()->format('Ymd_His') . ".pdf";
        
        return $pdf->download($filename);
    }

    /**
     * Calculate passbook data with monthly totals and final balances
     */
    /**
     * Calculate passbook data with monthly totals and final balances
     */
    
    private function calculatePassbookData($monthlyTotals, $member, $year)
    {
        $entries = [];
        $runningBalances = [
            'SHARES' => 0,
            'SAVINGS' => 0,
            'SSAVINGS' => 0,
            'BUILDING' => 0,
            'LOAN_INTEREST' => 0
        ];

        // Get opening balances (all transactions before the selected year)
        $openingBalances = Balance::where('mobile', $member->mobile)
            ->whereYear('created_at', '<', $year)
            ->selectRaw('
                type,
                SUM(debit) as total_debit,
                SUM(credit) as total_credit
            ')
            ->groupBy('type')
            ->get();

        foreach ($openingBalances as $opening) {
            $runningBalances[$opening->type] = $opening->total_debit - $opening->total_credit;
        }

        $openingBalancesTotal = array_sum($runningBalances);

        // Add opening balance row
        $entries[] = [
            'month_year' => $year . '-01',
            'month_name' => 'OPENING BALANCE',
            'date_display' => '01/01/' . $year,
            'shares_dr' => 0,
            'shares_cr' => 0,
            'shares_balance' => $runningBalances['SHARES'],
            'savings_dr' => 0,
            'savings_cr' => 0,
            'savings_balance' => $runningBalances['SAVINGS'],
            'special_savings_dr' => 0,
            'special_savings_cr' => 0,
            'special_savings_balance' => $runningBalances['SSAVINGS'],
            'building_dr' => 0,
            'building_cr' => 0,
            'building_balance' => $runningBalances['BUILDING'],
            'loan_interest_dr' => 0,
            'loan_interest_cr' => 0,
            'loan_interest_balance' => $runningBalances['LOAN_INTEREST'],
            'monthly_total' => 0,
            'final_balance' => $openingBalancesTotal,
            'is_opening_balance' => true
        ];

        // Process each month
        foreach ($monthlyTotals as $monthly) {
            // Calculate monthly totals for each account
            $sharesMonthly = $monthly->shares_dr - $monthly->shares_cr;
            $savingsMonthly = $monthly->savings_dr - $monthly->savings_cr;
            $specialSavingsMonthly = $monthly->special_savings_dr - $monthly->special_savings_cr;
            $buildingMonthly = $monthly->building_dr - $monthly->building_cr;
            $loanInterestMonthly = $monthly->loan_interest_dr - $monthly->loan_interest_cr;
            
            $monthlyTotal = $sharesMonthly + $savingsMonthly + $specialSavingsMonthly + $buildingMonthly + $loanInterestMonthly;

            // Update running balances
            $runningBalances['SHARES'] += $sharesMonthly;
            $runningBalances['SAVINGS'] += $savingsMonthly;
            $runningBalances['SSAVINGS'] += $specialSavingsMonthly;
            $runningBalances['BUILDING'] += $buildingMonthly;
            $runningBalances['LOAN_INTEREST'] += $loanInterestMonthly;

            $finalBalance = array_sum($runningBalances);

            $entries[] = [
                'month_year' => $monthly->month_year,
                'month_name' => $monthly->month_name,
                'date_display' => '01/' . str_pad($monthly->month, 2, '0', STR_PAD_LEFT) . '/' . $monthly->year,
                'shares_dr' => $monthly->shares_dr,
                'shares_cr' => $monthly->shares_cr,
                'shares_balance' => $runningBalances['SHARES'],
                'savings_dr' => $monthly->savings_dr,
                'savings_cr' => $monthly->savings_cr,
                'savings_balance' => $runningBalances['SAVINGS'],
                'special_savings_dr' => $monthly->special_savings_dr,
                'special_savings_cr' => $monthly->special_savings_cr,
                'special_savings_balance' => $runningBalances['SSAVINGS'],
                'building_dr' => $monthly->building_dr,
                'building_cr' => $monthly->building_cr,
                'building_balance' => $runningBalances['BUILDING'],
                'loan_interest_dr' => $monthly->loan_interest_dr,
                'loan_interest_cr' => $monthly->loan_interest_cr,
                'loan_interest_balance' => $runningBalances['LOAN_INTEREST'],
                'monthly_total' => $monthlyTotal,
                'final_balance' => $finalBalance,
                'is_opening_balance' => false
            ];
        }

        return [
            'entries' => $entries,
            'final_balances' => $runningBalances
        ];
    }

    public function schedule($id, Request $request)
    {
        $member = Member::with(['categoryDetails'])->findOrFail($id);
        
        $year = $request->input('year', date('Y'));
        $month = $request->input('month', date('m'));
        
        // Get all transactions for the selected month
        $transactions = Balance::where('mobile', $member->mobile)
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->orderBy('created_at', 'asc')
            ->get();

        // Format transactions in a simple way
        $simpleEntries = $this->formatSimpleSchedule($transactions, $member, $year, $month);
        
        // Get available years and months for filter
        $availableYears = Balance::where('mobile', $member->mobile)
            ->selectRaw('YEAR(created_at) as year')
            ->distinct()
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->toArray();

        $availableMonths = Balance::where('mobile', $member->mobile)
            ->whereYear('created_at', $year)
            ->selectRaw('MONTH(created_at) as month')
            ->distinct()
            ->orderBy('month', 'asc')
            ->pluck('month')
            ->map(function ($month) {
                return [
                    'value' => $month,
                    'name' => Carbon::create()->month($month)->format('F')
                ];
            })
            ->toArray();

        // Simple monthly summary
        $monthlySummary = $this->calculateSimpleSummary($transactions);

        return Inertia::render('Passbook/Schedule', [
            'member' => $member,
            'transactions' => $simpleEntries,
            'monthlySummary' => $monthlySummary,
            'availableYears' => $availableYears,
            'availableMonths' => $availableMonths,
            'filters' => [
                'year' => (int)$year,
                'month' => (int)$month
            ]
        ]);
    }

    /**
     * Format simple schedule data
     */
    private function formatSimpleSchedule($transactions, $member, $year, $month)
    {
        $entries = [];

        foreach ($transactions as $transaction) {
            $type = $this->getAccountTypeName($transaction->type);
            $amount = $transaction->debit > 0 ? $transaction->debit : $transaction->credit;
            $entryType = $transaction->debit > 0 ? 'Payment' : 'Deductions';

            $entries[] = [
                'date' => Carbon::parse($transaction->created_at)->format('d/m/Y'),
                'time' => Carbon::parse($transaction->created_at)->format('h:i A'),
                'account_type' => $type,
                'description' => $transaction->description ?? $type . ' ' . $entryType,
                'transaction_type' => $entryType,
                'amount' => $amount,
                'type' => $transaction->type,
                'debit' => $transaction->debit,
                'credit' => $transaction->credit,
            ];
        }

        return $entries;
    }

    /**
     * Get friendly account type names
     */
    private function getAccountTypeName($type)
    {
        $names = [
            'SHARES' => 'Shares',
            'SAVINGS' => 'Savings', 
            'SSAVINGS' => 'Special Savings',
            'BUILDING' => 'Building Fund',
            'LOAN_INTEREST' => 'Loan Interest'
        ];

        return $names[$type] ?? $type;
    }

    /**
     * Calculate simple monthly summary
     */
    private function calculateSimpleSummary($transactions)
    {
        $summary = [
            'total_payments' => 0,
            'total_withdrawals' => 0,
            'net_total' => 0,
            'transaction_count' => $transactions->count(),
            'by_account' => []
        ];

        foreach ($transactions as $transaction) {
            if ($transaction->debit > 0) {
                $summary['total_payments'] += $transaction->debit;
                
                // Group by account type
                if (!isset($summary['by_account'][$transaction->type])) {
                    $summary['by_account'][$transaction->type] = [
                        'payments' => 0,
                        'withdrawals' => 0
                    ];
                }
                $summary['by_account'][$transaction->type]['payments'] += $transaction->debit;
            }
            
            if ($transaction->credit > 0) {
                $summary['total_withdrawals'] += $transaction->credit;
                
                if (!isset($summary['by_account'][$transaction->type])) {
                    $summary['by_account'][$transaction->type] = [
                        'payments' => 0,
                        'withdrawals' => 0
                    ];
                }
                $summary['by_account'][$transaction->type]['withdrawals'] += $transaction->credit;
            }
        }

        $summary['net_total'] = $summary['total_payments'] - $summary['total_withdrawals'];

        return $summary;
    }
}