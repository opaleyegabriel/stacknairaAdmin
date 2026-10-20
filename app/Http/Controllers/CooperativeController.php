<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CooperativeController extends Controller
{
    /**
     * Display cooperative members listing
     */
    public function index(Request $request)
    {
        $query = Member::with([
            'registrationTrack',
            'categoryDetails',
            'balances'
        ]);

        // Search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('mobile', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Category filter
        $categoryFilter = $request->input('category');
        if ($categoryFilter && $categoryFilter !== 'all') {
            $query->where('category', $categoryFilter);
        }

        // Status filter
        $statusFilter = $request->input('status');
        if ($statusFilter) {
            if ($statusFilter === 'active') {
                $query->active();
            } elseif ($statusFilter === 'inactive') {
                $query->where('nstatus', 0);
            }
        }

        // Registration status filter
        $registrationFilter = $request->input('registration');
        if ($registrationFilter) {
            if ($registrationFilter === 'registered') {
                $query->whereHas('registrationTrack');
            } elseif ($registrationFilter === 'not_registered') {
                $query->whereDoesntHave('registrationTrack');
            }
        }

        $members = $query->orderBy('created_at', 'desc')
                        ->paginate(20);

        // Get cooperative data for each member
        $cooperativeData = $members->map(function ($member) {
            return $member->getCooperativeFinancialSummary();
        });

        // Get categories for filter
        $categories = Category::all();

        return Inertia::render('Cooperative/Index', [
            'members' => $members,
            'cooperativeData' => $cooperativeData->toArray(),
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'status', 'registration'])
        ]);
    }

    /**
     * Show cooperative details for a specific member
     */
    public function show($id)
    {
        $member = Member::with([
            'registrationTrack',
            'categoryDetails',
            'balances',
            'setups'
        ])->findOrFail($id);

        $cooperativeSummary = $member->getCooperativeFinancialSummary();

        return Inertia::render('Cooperative/Show', [
            'member' => $member,
            'cooperativeSummary' => $cooperativeSummary
        ]);
    }

    /**
     * Get cooperative statistics
     */
    public function statistics()
    {
        $totalMembers = Member::count();
        $activeMembers = Member::active()->count();
        $registeredMembers = Member::has('registrationTrack')->count();
        $notRegisteredMembers = Member::doesntHave('registrationTrack')->count();

        // Calculate total amounts owed
        $totalOwed = 0;
        $members = Member::with(['registrationTrack', 'categoryDetails'])->get();
        
        foreach ($members as $member) {
            $obligations = $member->getCooperativeObligations();
            if ($obligations['status'] === 'owing') {
                $totalOwed += $obligations['total_owed'];
            }
        }

        $categoryStats = Category::withCount(['members as total_members', 
            'members as active_members' => function($query) {
                $query->active();
            }])->get();

        return response()->json([
            'total_members' => $totalMembers,
            'active_members' => $activeMembers,
            'registered_members' => $registeredMembers,
            'not_registered_members' => $notRegisteredMembers,
            'total_amount_owed' => $totalOwed,
            'category_stats' => $categoryStats
        ]);
    }
}