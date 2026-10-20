<?php

namespace App\Http\Controllers;

use App\Models\AjoGroup;
use App\Models\Member;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AjoGroupsController extends Controller
{
    /**
     * Display AJO groups listing
     */
    public function index(Request $request)
    {
        $query = AjoGroup::with([
            'members.member',
            'contributions',
            'payouts'
        ]);

        // Search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('group_name', 'like', "%{$search}%")
                  ->orWhere('amount', 'like', "%{$search}%")
                  ->orWhere('interval_type', 'like', "%{$search}%");
            });
        }

        // Status filter
        $statusFilter = $request->input('status');
        if ($statusFilter && $statusFilter !== 'all') {
            $query->where('status', $statusFilter);
        }

        // Frequency filter (using interval_type)
        $frequencyFilter = $request->input('frequency');
        if ($frequencyFilter && $frequencyFilter !== 'all') {
            $query->where('interval_type', $frequencyFilter);
        }

        $groups = $query->orderBy('created_at', 'desc')
                       ->paginate(20);

        // Get performance data for each group
        $performanceData = $groups->map(function ($group) {
            $performance = $group->performance_summary;
            
            return [
                'group' => [
                    'id' => $group->id,
                    'group_name' => $group->group_name,
                    'amount' => $group->amount,
                    'interval_type' => $group->interval_type,
                    'status' => $group->status,
                    'current_round' => $group->current_round,
                    'members' => $group->members, // max members
                    'joined_count' => $group->joined_count,
                    'start_date' => $group->start_date?->format('Y-m-d'),
                    'start_time' => $group->start_time?->format('Y-m-d H:i:s'),
                    'next_payout_date' => $group->next_payout_date?->format('Y-m-d'),
                ],
                'performance' => $performance,
                'members_count' => $group->current_members_count,
            ];
        });

        return Inertia::render('AjoGroups/Index', [
            'groups' => $groups,
            'performanceData' => $performanceData,
            'filters' => $request->only(['search', 'status', 'frequency'])
        ]);
    }

    /**
     * Show AJO group details
     */
    public function show($id)
    {
        $group = AjoGroup::with([
            'members.member',
            'contributions.member',
            'payouts.receiver'
        ])->findOrFail($id);

        $performance = $group->performance_summary;
        $members = $group->members()->with('member')->get();
        $contributions = $group->contributions()->with('member')->orderBy('created_at', 'desc')->get();
        $payouts = $group->payouts()->with('receiver')->orderBy('paid_at', 'desc')->get();

        return Inertia::render('AjoGroups/Show', [
            'group' => $group,
            'performance' => $performance,
            'members' => $members,
            'contributions' => $contributions,
            'payouts' => $payouts
        ]);
    }

    /**
     * Show members with group AJO activities
     */
    public function members(Request $request)
    {
        $query = Member::with([
            'ajoGroupMemberships.group',
            'ajoGroupContributions',
            'ajoGroupPayouts',
            'categoryDetails'
        ]);

        // Search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('mobile', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Group status filter
        $groupStatus = $request->input('group_status');
        if ($groupStatus) {
            if ($groupStatus === 'with_groups') {
                $query->whereHas('ajoGroupMemberships');
            } elseif ($groupStatus === 'without_groups') {
                $query->whereDoesntHave('ajoGroupMemberships');
            }
        }

        // Category filter
        $categoryFilter = $request->input('category');
        if ($categoryFilter && $categoryFilter !== 'all') {
            $query->where('category', $categoryFilter);
        }

        $members = $query->orderBy('created_at', 'desc')
                        ->paginate(20);

        // Get group AJO data for each member
        // In AjoGroupsController members method
        $groupAjoData = $members->map(function ($member) {
            $summary = $member->getGroupAjoSummary();
            
            return [
                'member' => [
                    'id' => $member->id,
                    'name' => $member->name,
                    'mobile' => $member->mobile,
                    'category' => $member->category,
                    'nstatus' => $member->nstatus,
                ],
                'summary' => $summary,
                'groups' => $summary['groups'], // Changed from 'active_groups'
            ];
        });

        // Get categories for filter
        $categories = Category::all();

        return Inertia::render('AjoGroups/Members', [
            'members' => $members,
            'groupAjoData' => $groupAjoData,
            'categories' => $categories,
            'filters' => $request->only(['search', 'group_status', 'category'])
        ]);
    }

    /**
     * Get AJO groups statistics
     */
    public function statistics()
    {
        $totalGroups = AjoGroup::count();
        $activeGroups = AjoGroup::where('status', 'active')->count();
        $completedGroups = AjoGroup::where('status', 'completed')->count();
        
        $totalMembers = \DB::table('ajo_members')->distinct('mobile')->count('mobile');
        $totalContributions = \DB::table('ajo_contributions')->sum('amount');
        $totalPayouts = \DB::table('ajo_payouts')->sum('amount');

        // Group by interval_type
        $frequencyStats = AjoGroup::select('interval_type', \DB::raw('count(*) as count'))
            ->groupBy('interval_type')
            ->get();

        return response()->json([
            'total_groups' => $totalGroups,
            'active_groups' => $activeGroups,
            'completed_groups' => $completedGroups,
            'total_members' => $totalMembers,
            'total_contributions' => $totalContributions,
            'total_payouts' => $totalPayouts,
            'frequency_stats' => $frequencyStats,
            'net_balance' => $totalContributions - $totalPayouts,
        ]);
    }

    /**
     * Export AJO groups report
     */
    public function exportReport(Request $request)
    {
        $request->validate([
            'search' => 'nullable|string',
            'status' => 'nullable|string',
            'frequency' => 'nullable|string',
        ]);

        $query = AjoGroup::with(['members', 'contributions', 'payouts']);

        // Apply filters
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('group_name', 'like', "%{$search}%")
                  ->orWhere('amount', 'like', "%{$search}%");
            });
        }

        $statusFilter = $request->input('status');
        if ($statusFilter && $statusFilter !== 'all') {
            $query->where('status', $statusFilter);
        }

        $frequencyFilter = $request->input('frequency');
        if ($frequencyFilter && $frequencyFilter !== 'all') {
            $query->where('interval_type', $frequencyFilter);
        }

        $groups = $query->orderBy('created_at', 'desc')->get();

        $reportData = $groups->map(function ($group) {
            $performance = $group->performance_summary;

            return [
                'group_name' => $group->group_name,
                'amount' => $group->amount,
                'interval_type' => $group->interval_type,
                'status' => $group->status,
                'current_round' => $group->current_round,
                'members_count' => $group->current_members_count,
                'max_members' => $group->members,
                'total_contributions' => $performance['total_contributions'],
                'total_payouts' => $performance['total_payouts'],
                'group_balance' => $performance['group_balance'],
                'completion_rate' => $performance['completion_rate'],
                'start_date' => $group->start_date?->format('Y-m-d'),
            ];
        });

        return response()->json([
            'data' => $reportData,
            'total_groups' => $groups->count(),
            'filters' => $request->only(['search', 'status', 'frequency'])
        ]);
    }

    /**
     * API: Get group members
     */
    public function groupMembers($id)
    {
        $group = AjoGroup::with(['members.member'])->findOrFail($id);
        
        return response()->json([
            'members' => $group->members,
            'total_members' => $group->current_members_count,
        ]);
    }

    /**
     * API: Get group contributions
     */
    public function groupContributions($id)
    {
        $group = AjoGroup::findOrFail($id);
        $contributions = $group->contributions()
            ->with('member')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'contributions' => $contributions,
            'total_contributions' => $group->total_contributions,
        ]);
    }

    /**
     * API: Get group payouts
     */
    public function groupPayouts($id)
    {
        $group = AjoGroup::findOrFail($id);
        $payouts = $group->payouts()
            ->with('receiver')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'payouts' => $payouts,
            'total_payouts' => $group->total_payouts,
        ]);
    }

    /**
     * API: Get member's AJO groups
     */
    public function memberGroups($memberId)
    {
        $member = Member::findOrFail($memberId);
        $groups = $member->ajoGroupMemberships()
            ->with('group')
            ->orderBy('joined_at', 'desc')
            ->get();

        return response()->json([
            'groups' => $groups,
            'total_groups' => $groups->count(),
        ]);
    }

    /**
     * API: Get member's AJO summary
     */
    public function memberAjoSummary($memberId)
    {
        $member = Member::findOrFail($memberId);
        $summary = $member->getGroupAjoSummary();

        return response()->json([
            'summary' => $summary,
            'member' => [
                'id' => $member->id,
                'name' => $member->name,
                'mobile' => $member->mobile,
            ],
        ]);
    }
}