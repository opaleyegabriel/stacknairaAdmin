<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\AjoGroup;
use App\Models\Balance;
use App\Models\Referral;
use App\Models\TrackRegistration;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class MemberController extends Controller
{
    /**
     * Display a listing of members.
     */
    public function index(Request $request)
    {
        // Get ALL mobile numbers that are fully registered
        $registeredMobileNumbers = TrackRegistration::pluck('mobile')->toArray();

        $query = Member::query();

        // Search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('mobile', 'like', "%{$search}%")
                ->orWhere('account_number', 'like', "%{$search}%")
                ->orWhere('bank_name', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($status = $request->input('status')) {
            if ($status === 'active') {
                $query->active();
            } elseif ($status === 'inactive') {
                $query->where('nstatus', 0);
            }
        }

        // Category filter
        $category = $request->input('category');
        if ($category && $category !== 'all') {
            $query->where('category', $category);
        }

        // Registration status filter
        $registration = $request->input('registration');
        if ($registration && $registration !== 'all') {
            if ($registration === 'registered') {
                $query->whereIn('mobile', $registeredMobileNumbers);
            } elseif ($registration === 'pending') {
                $query->whereNotIn('mobile', $registeredMobileNumbers);
            }
        }

        // Get paginated members for the table
        $members = $query->withCount(['referralsMade', 'ajoMemberships'])
                        ->orderBy('created_at', 'desc')
                        ->paginate(20);

        // Add registration status to each member
        $members->getCollection()->transform(function ($member) use ($registeredMobileNumbers) {
            $member->is_fully_registered = in_array($member->mobile, $registeredMobileNumbers);
            return $member;
        });

        // Calculate counts for ALL members (not filtered)
        $allMembers = Member::all();

        // Stats for ALL members
        $totalMembers = $allMembers->count();
        $activeMembers = $allMembers->where('nstatus', true)->count();

        // Calculate ACTUAL total referrals from referrals table for ALL members
        $totalReferrals = Referral::count();

        // Calculate total groups for ALL members
        $totalGroups = $allMembers->sum(function ($member) {
            return is_numeric($member->ajo_memberships_count) ? $member->ajo_memberships_count : 0;
        });

        // Count fully registered members
        $fullyRegisteredCount = count($registeredMobileNumbers);

        // Calculate registration counts
        $registrationCounts = [
            'all' => $allMembers->count(),
            'registered' => $fullyRegisteredCount,
            'pending' => $allMembers->count() - $fullyRegisteredCount,
        ];

        // Calculate counts for filters (based on current filters)
        $statusCounts = [
            'all' => $query->count(),
            'active' => $query->active()->count(),
            'inactive' => Member::where('nstatus', 0)->count(),
        ];

        $categoryCounts = [
            'all' => Member::count(),
            'Category A' => Member::where('category', 'Category A')->count(),
            'Category B' => Member::where('category', 'Category B')->count(),
            'Category C' => Member::where('category', 'Category C')->count(),
            'Category D' => Member::where('category', 'Category D')->count(),
        ];

        return Inertia::render('Members/Index', [
            'members' => $members,
            'filters' => $request->only(['search', 'status', 'category', 'registration']),
            'statusCounts' => $statusCounts,
            'categoryCounts' => $categoryCounts,
            'registrationCounts' => $registrationCounts,
            'stats' => [
                'totalMembers' => $totalMembers,
                'activeMembers' => $activeMembers,
                'totalReferrals' => $totalReferrals,
                'totalGroups' => $totalGroups,
                'fullyRegisteredCount' => $fullyRegisteredCount,
            ],
        ]);
    }

    /**
     * Display the specified member.
     */
    public function show($id)
    {
        $member = Member::with([
            'setups',
            'buildingTrack',
            'registrationTrack',
            'bankWitness',
            'referralsMade.referredMember',
            'referredBy.referrer',
            'contributionPlan',
            'balances' => function ($query) {
                $query->orderBy('created_at', 'desc');
            },
            'ajoMemberships.group',
            'ajoContributions.group',
            'ajoPayouts.group'
        ])->findOrFail($id);

        // Calculate total balances by type
        $balanceSummary = [
            'SHARES' => $member->total_shares,
            'SAVINGS' => $member->total_savings,
            'SSAVINGS' => $member->balances->where('type', 'SSAVINGS')->sum('debit') -
                         $member->balances->where('type', 'SSAVINGS')->sum('credit'),
            'WALLET' => $member->wallet_balance,
            'BUILDING' => $member->balances->where('type', 'BUILDING')->sum('debit') -
                         $member->balances->where('type', 'BUILDING')->sum('credit'),
            'AJO' => $member->balances->where('type', 'AJO')->sum('debit') -
                         $member->balances->where('type', 'AJO')->sum('credit'),
        ];

        return Inertia::render('Members/Show', [
            'member' => $member,
            'balanceSummary' => $balanceSummary,
        ]);
    }

    /**
     * Get member financial summary
     */
    public function financialSummary($id)
    {
        $member = Member::findOrFail($id);

        $summary = [
            'total_shares' => $member->total_shares,
            'total_savings' => $member->total_savings,
            'wallet_balance' => $member->wallet_balance,
            'referral_earnings' => $member->referral_earnings,
            'referral_count' => $member->referral_count,
            'has_building' => $member->has_building_payment,
            'has_completed_registration' => $member->has_completed_registration,
        ];

        return response()->json($summary);
    }

    /**
     * Get member Ajo groups
     */
    public function ajoGroups($id)
    {
        $member = Member::findOrFail($id);

        $groups = $member->ajoMemberships()->with(['group' => function ($query) {
            $query->select('id', 'group_name', 'amount', 'status', 'current_round');
        }])->get();

        return response()->json($groups);
    }

    /**
     * Update member status
     */
    public function updateStatus(Request $request, $id)
    {
        $member = Member::findOrFail($id);

        $request->validate([
            'nstatus' => 'required|boolean',
        ]);

        $member->update(['nstatus' => $request->nstatus]);

        $status = $request->nstatus ? 'activated' : 'deactivated';

        return redirect()->route('members.index', $id)->with('message', "Member {$status} successfully!");
    }

    /**
     * Update member photo with loading state and redirect response
     */
    public function updatePhoto(Request $request, $id)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $member = Member::findOrFail($id);

        try {
            // Use base_path() to get the root directory of your Laravel app
            $uploadDirectory = base_path('storage/member-photos');

            // Ensure the directory exists
            if (!file_exists($uploadDirectory)) {
                mkdir($uploadDirectory, 0755, true);
            }

            // Delete old photo if exists
            if ($member->photo && file_exists($uploadDirectory . '/' . $member->photo)) {
                unlink($uploadDirectory . '/' . $member->photo);
            }

            // Store new photo with unique name
            $photoFile = $request->file('photo');
            $photoName = time() . '_' . uniqid() . '.' . $photoFile->getClientOriginalExtension();

            // Move the file to the correct directory
            $photoFile->move($uploadDirectory, $photoName);

            // Update member record
            $member->update(['photo' => $photoName]);

            return redirect()->route('members.show', $id)->with('success', 'Photo updated successfully!');

        } catch (\Exception $e) {
            \Log::error('Photo upload failed: ' . $e->getMessage());
            return redirect()->route('members.show', $id)->with('error', 'Failed to upload photo.');
        }
    }

    /**
     * Show statement preview page
     */
    public function statementPreview($id, Request $request)
    {
        $member = Member::findOrFail($id);

        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'type' => 'nullable|in:SHARES,SAVINGS,SSAVINGS,WALLET,AJO,BUILDING,ALL',
        ]);

        $startDate = $request->start_date;
        $endDate = $request->end_date;
        $type = $request->type;

        $statementData = $member->getStatementData($startDate, $endDate);

        // Filter by type if specified
        if ($type && $type !== 'ALL') {
            $statementData['transactions'] = $statementData['transactions']->filter(function ($transaction) use ($type) {
                return $transaction->type === $type;
            });
        }

        return Inertia::render('Members/StatementPreview', [
            'member' => $member,
            'statementData' => $statementData,
            'filters' => $request->only(['start_date', 'end_date', 'type'])
        ]);
    }

    /**
     * Remove member photo with redirect response
     */
    public function removePhoto($id)
    {
        $member = Member::findOrFail($id);

        try {
            // Define the photo path based on your current storage location
            $photoPath = base_path('storage/member-photos/' . $member->photo);

            // Delete the photo file if it exists
            if ($member->photo && file_exists($photoPath)) {
                unlink($photoPath);
            }

            // Update member record to remove photo reference
            $member->update(['photo' => null]);

            return redirect()->route('members.show', $id)->with('success', 'Photo removed successfully!');

        } catch (\Exception $e) {
            return redirect()->route('members.show', $id)->with('error', 'Failed to remove photo. Please try again.');
        }
    }

    /**
     * Generate statement PDF
     */
    public function generateStatement(Request $request, $id)
    {
        $member = Member::findOrFail($id);

        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'type' => 'nullable|in:SHARES,SAVINGS,SSAVINGS,WALLET,AJO,BUILDING,ALL',
        ]);

        $startDate = $request->start_date;
        $endDate = $request->end_date;
        $type = $request->type;

        $statementData = $member->getStatementData($startDate, $endDate);

        // Filter by type if specified
        if ($type && $type !== 'ALL') {
            $statementData['transactions'] = $statementData['transactions']->filter(function ($transaction) use ($type) {
                return $transaction->type === $type;
            });
        }

        $pdf = Pdf::loadView('pdf.member-statement', $statementData);

        if ($request->input('download')) {
            return $pdf->download("statement-{$member->mobile}-{$startDate}-to-{$endDate}.pdf");
        }

        return $pdf->stream("statement-{$member->mobile}.pdf");
    }

    /**
     * Get statement data as JSON (for preview)
     */
    public function getStatementData(Request $request, $id)
    {
        $member = Member::findOrFail($id);

        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'type' => 'nullable|in:SHARES,SAVINGS,SSAVINGS,WALLET,BUILDING,ALL',
        ]);

        $startDate = $request->start_date;
        $endDate = $request->end_date;
        $type = $request->type;

        $statementData = $member->getStatementData($startDate, $endDate);

        // Filter by type if specified
        if ($type && $type !== 'ALL') {
            $statementData['transactions'] = $statementData['transactions']->filter(function ($transaction) use ($type) {
                return $transaction->type === $type;
            });
        }

        return response()->json($statementData);
    }

    public function updateName(Request $request, $id)
    {
        $member = Member::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $member->update(['name' => $request->name]);

        return redirect()->back()->with('message', 'Name updated successfully!');
    }

    public function updateEmail(Request $request, $id)
    {
        $member = Member::findOrFail($id);

        $request->validate([
            'email' => 'required|email|max:255|unique:members,email,' . $id,
        ]);

        $member->update(['email' => $request->email]);

        return redirect()->back()->with('message', 'Email updated successfully!');
    }

    public function updatePhone(Request $request, $id)
    {
        $member = Member::findOrFail($id);

        // Check if member has category or balances
        if ($member->category || $member->balances()->exists()) {
            return redirect()->back()->with('error', 'Phone number cannot be updated for members with category or balance records.');
        }

        $request->validate([
            'phone' => 'required|string|max:20|unique:members,mobile,' . $id,
        ]);

        $member->update(['mobile' => $request->phone]);

        return redirect()->back()->with('message', 'Phone number updated successfully!');
    }

    public function getSetups($id)
    {
        $member = Member::findOrFail($id);
        $setups = $member->setups()->get();

        return response()->json($setups);
    }

    public function updateCategory(Request $request, $id)
    {
        $member = Member::findOrFail($id);

        $request->validate([
            'category' => 'required|in:Category A,Category B,Category C,Category D',
            'setups' => 'required|array',
            'setups.*.type' => 'required|string',
            'setups.*.pcent' => 'required|numeric',
        ]);

        try {
            // Update member category
            $member->update(['category' => $request->category]);

            // Update or create setups
            $this->updateOrCreateSetups($member->mobile, $request->setups);

            return redirect()->back()->with('message', 'Category and setups updated successfully!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to update category: ' . $e->getMessage());
        }
    }

    /**
     * Update or create member setups
     */
    private function updateOrCreateSetups($mobile, $setups)
    {
        foreach ($setups as $setup) {
            \App\Models\MemberSetup::updateOrCreate(
                [
                    'mobile' => $mobile,
                    'type' => $setup['type']
                ],
                [
                    'pcent' => $setup['pcent']
                ]
            );
        }
    }

    public function updateAccount(Request $request, $id)
    {
        $member = Member::findOrFail($id);

        $request->validate([
            'account_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:20',
        ]);

        try {
            $member->update([
                'account_name' => $request->account_name,
                'account_number' => $request->account_number,
                'bank_name' => 'Wema Bank' // Always set to Wema Bank
            ]);

            return redirect()->back()->with('message', 'Account details updated successfully!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to update account details: ' . $e->getMessage());
        }
    }

            /**
         * Reset member password.
         *
         * Writes the literal string '123456' to tbl_members.pwd and sets
         * must_change_password = true. The password is consumed by the external
         * mobile API — not Laravel's auth — so no hashing is applied.
         */
        public function resetPassword($id)
        {
            $member = Member::findOrFail($id);

            try {
                $member->update([
                    'pwd'                  => '123456',
                    'must_change_password' => true,
                ]);

                return redirect()->back()->with('message', 'Password reset to 123456 successfully!');

            } catch (\Exception $e) {
                return redirect()->back()->with('error', 'Failed to reset password: ' . $e->getMessage());
            }
        }
}