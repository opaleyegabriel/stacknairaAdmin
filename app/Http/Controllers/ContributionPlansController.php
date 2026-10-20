<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\ContributionPlan;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContributionPlansController extends Controller
{
    /**
     * Display members with contribution plans
     */
    public function index(Request $request)
    {
        $query = Member::with([
            'activeContributionPlans',
            'completedContributionPlans',
            'ajoContributions',
            'categoryDetails',
            'balances' => function($query) {
                $query->where('type', 'AJO')->orderBy('created_at', 'desc');
            }
        ]);

        // Search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('mobile', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Plan status filter
        $planStatus = $request->input('plan_status');
        if ($planStatus) {
            if ($planStatus === 'with_plans') {
                $query->whereHas('activeContributionPlans');
            } elseif ($planStatus === 'without_plans') {
                $query->whereDoesntHave('activeContributionPlans');
            } elseif ($planStatus === 'with_completed') {
                $query->whereHas('completedContributionPlans');
            }
        }

        // Category filter
        $categoryFilter = $request->input('category');
        if ($categoryFilter && $categoryFilter !== 'all') {
            $query->where('category', $categoryFilter);
        }

        $members = $query->orderBy('created_at', 'desc')
                        ->paginate(20);

        // Get contribution plan data for each member
        $contributionData = $members->map(function ($member) {
            $summary = $member->getContributionPlanSummary();
            $ajoSummary = $this->getMemberAjoSummary($member);
            
            return [
                'member' => [
                    'id' => $member->id,
                    'name' => $member->name,
                    'mobile' => $member->mobile,
                    'category' => $member->category,
                    'nstatus' => $member->nstatus,
                ],
                'summary' => $summary,
                'contribution_plans' => $summary['active_plans'],
                'ajo_contributions' => $ajoSummary,
            ];
        });

        // Get categories for filter
        $categories = Category::all();

        return Inertia::render('ContributionPlans/Index', [
            'members' => $members,
            'contributionData' => $contributionData,
            'categories' => $categories,
            'filters' => $request->only(['search', 'plan_status', 'category'])
        ]);
    }

    /**
     * Show contribution plan details for a specific member
     */
    public function show($id)
    {
        $member = Member::with([
            'activeContributionPlans',
            'completedContributionPlans',
            'ajoContributions' => function($query) {
                $query->orderBy('created_at', 'desc');
            },
            'categoryDetails',
            'balances' => function($query) {
                $query->where('type', 'AJO')->orderBy('created_at', 'desc');
            }
        ])->findOrFail($id);

        $contributionSummary = $member->getContributionPlanSummary();
        $ajoSummary = $this->getMemberAjoSummary($member, true); // Include transactions for show page
        $allPlans = $member->contributionPlans()->with('contributions')->get();

        return Inertia::render('ContributionPlans/Show', [
            'member' => $member,
            'contributionSummary' => $contributionSummary,
            'ajoSummary' => $ajoSummary,
            'allPlans' => $allPlans
        ]);
    }

    /**
     * Get member AJO contribution summary from tbl_balances
     */
    private function getMemberAjoSummary(Member $member, bool $includeTransactions = false)
    {
        $ajoBalances = $member->balances()->where('type', 'AJO')->get();
        
        $totalDebit = $ajoBalances->sum('debit');
        $totalCredit = $ajoBalances->sum('credit');
        $netBalance = $totalDebit - $totalCredit;

        $summary = [
            'total_paid' => $totalDebit,
            'total_withdrawn' => $totalCredit,
            'net_balance' => $netBalance,
        ];

        // Include transactions if requested (for show page)
        if ($includeTransactions) {
            $transactions = $member->balances()
                ->where('type', 'AJO')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'debit' => $transaction->debit,
                        'credit' => $transaction->credit,
                        'balance' => $transaction->balance,
                        'description' => $transaction->description,
                        'reference' => $transaction->reference,
                        'created_at' => $transaction->created_at,
                        'updated_at' => $transaction->updated_at,
                    ];
                });

            $summary['transactions'] = $transactions;
        }

        return $summary;
    }

    /**
     * Get contribution plan statistics
     */
    public function statistics()
    {
        $totalMembers = Member::count();
        $membersWithPlans = Member::has('activeContributionPlans')->count();
        $totalActivePlans = ContributionPlan::where('status', 'ACTIVE')->count();
        $totalCompletedPlans = ContributionPlan::where('status', 'COMPLETED')->count();
        
        $totalPlanAmount = ContributionPlan::where('status', 'ACTIVE')->sum('amount');
        $totalContributions = \DB::table('ajo_contributions')->sum('amount');
        
        // Get total AJO contributions from balances table
        $totalAjoDebit = \DB::table('balances')
            ->where('type', 'AJO')
            ->sum('debit');
            
        $totalAjoCredit = \DB::table('balances')
            ->where('type', 'AJO')
            ->sum('credit');
            
        $totalAjoNetBalance = $totalAjoDebit - $totalAjoCredit;

        return response()->json([
            'total_members' => $totalMembers,
            'members_with_plans' => $membersWithPlans,
            'total_active_plans' => $totalActivePlans,
            'total_completed_plans' => $totalCompletedPlans,
            'total_plan_amount' => $totalPlanAmount,
            'total_contributions' => $totalContributions,
            'total_ajo_paid' => $totalAjoDebit,
            'total_ajo_withdrawn' => $totalAjoCredit,
            'total_ajo_net_balance' => $totalAjoNetBalance,
            'members_without_plans' => $totalMembers - $membersWithPlans,
        ]);
    }

    /**
     * Export member contribution report
     */
    public function exportReport(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'plan_status' => 'nullable|in:all,with_plans,without_plans,with_completed',
            'category' => 'nullable|string',
        ]);

        $query = Member::with([
            'activeContributionPlans',
            'balances' => function($query) {
                $query->where('type', 'AJO');
            }
        ]);

        // Apply filters
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('mobile', 'like', "%{$search}%");
            });
        }

        $planStatus = $request->input('plan_status');
        if ($planStatus) {
            if ($planStatus === 'with_plans') {
                $query->whereHas('activeContributionPlans');
            } elseif ($planStatus === 'without_plans') {
                $query->whereDoesntHave('activeContributionPlans');
            } elseif ($planStatus === 'with_completed') {
                $query->whereHas('completedContributionPlans');
            }
        }

        $categoryFilter = $request->input('category');
        if ($categoryFilter && $categoryFilter !== 'all') {
            $query->where('category', $categoryFilter);
        }

        $members = $query->orderBy('name')->get();

        $reportData = $members->map(function ($member) {
            $summary = $member->getContributionPlanSummary();
            $ajoSummary = $this->getMemberAjoSummary($member);

            return [
                'name' => $member->name,
                'mobile' => $member->mobile,
                'category' => $member->category,
                'status' => $member->nstatus ? 'Active' : 'Inactive',
                'active_plans' => $summary['active_plans_count'],
                'completed_plans' => $summary['completed_plans_count'],
                'total_plan_amount' => $summary['total_active_amount'],
                'total_contributions' => $summary['total_contributions'],
                'ajo_total_paid' => $ajoSummary['total_paid'],
                'ajo_total_withdrawn' => $ajoSummary['total_withdrawn'],
                'ajo_net_balance' => $ajoSummary['net_balance'],
            ];
        });

        return response()->json([
            'data' => $reportData,
            'total_members' => $members->count(),
            'filters' => $request->only(['search', 'plan_status', 'category', 'start_date', 'end_date'])
        ]);
    }

    /**
     * Get AJO transactions for a specific member
     */
    public function ajoTransactions($id)
    {
        $member = Member::findOrFail($id);

        $transactions = $member->balances()
            ->where('type', 'AJO')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'transactions' => $transactions,
            'summary' => $this->getMemberAjoSummary($member)
        ]);
    }
}