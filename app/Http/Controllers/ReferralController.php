<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\TrackRegistration;
use App\Models\Referral;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReferralController extends Controller
{
    /**
     * Display referred members for logged-in merchant
     */
    public function index(Request $request)
    {
        // Get logged-in merchant's mobile number
        $merchantMobile = auth()->user()->mobile ?? auth()->user()->phone;
        
        if (!$merchantMobile) {
            return Inertia::render('Referrals/Index', [
                'referredMembers' => [],
                'filters' => $request->only(['search']),
                'merchantMobile' => null,
                'error' => 'Unable to identify merchant mobile number'
            ]);
        }

        // Query members table where rmobile matches merchant's mobile
        $query = Member::where('rmobile', $merchantMobile);

        // Search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('mobile', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Registration filter (based on track_registration)
        $registrationFilter = $request->input('registration');
        if ($registrationFilter && $registrationFilter !== 'all') {
            if ($registrationFilter === 'registered') {
                // Get mobile numbers of registered members
                $registeredMobiles = TrackRegistration::pluck('mobile')->toArray();
                $query->whereIn('mobile', $registeredMobiles);
            } elseif ($registrationFilter === 'not_registered') {
                // Get mobile numbers of registered members and exclude them
                $registeredMobiles = TrackRegistration::pluck('mobile')->toArray();
                $query->whereNotIn('mobile', $registeredMobiles);
            }
        }

        $referredMembers = $query->orderBy('created_at', 'desc')
                                ->paginate(20);

        // Get cooperative data for each referred member
        $cooperativeData = $referredMembers->map(function ($member) {
            return $member->getCooperativeFinancialSummary();
        });

        // Get registered mobile numbers
        $registeredMobiles = TrackRegistration::pluck('mobile')->toArray();

        // Get statistics
        $totalReferred = Member::where('rmobile', $merchantMobile)->count();
        $registeredReferred = Member::where('rmobile', $merchantMobile)
            ->whereIn('mobile', $registeredMobiles)
            ->count();

        return Inertia::render('Referrals/Index', [
            'referredMembers' => $referredMembers,
            'cooperativeData' => $cooperativeData->toArray(),
            'filters' => $request->only(['search', 'registration']),
            'merchantMobile' => $merchantMobile,
            'statistics' => [
                'total_referred' => $totalReferred,
                'registered_referred' => $registeredReferred,
            ],
            'registeredMobiles' => $registeredMobiles // Pass for frontend use
        ]);
    }

    /**
     * Get referral statistics for logged-in merchant
     */
    public function statistics()
    {
        $merchantMobile = auth()->user()->mobile ?? auth()->user()->phone;
        
        if (!$merchantMobile) {
            return response()->json([
                'error' => 'Unable to identify merchant mobile number'
            ], 400);
        }

        $registeredMobiles = TrackRegistration::pluck('mobile')->toArray();

        $totalReferred = Member::where('rmobile', $merchantMobile)->count();
        $registeredReferred = Member::where('rmobile', $merchantMobile)
            ->whereIn('mobile', $registeredMobiles)
            ->count();

        // Calculate commission from referrals table
        $totalCommission = Referral::byReferrer($merchantMobile)->sum('amount');
        $totalReferralRecords = Referral::byReferrer($merchantMobile)->count();

        return response()->json([
            'total_referred' => $totalReferred,
            'registered_referred' => $registeredReferred,
            'total_commission' => $totalCommission,
            'total_referral_records' => $totalReferralRecords,
            'merchant_mobile' => $merchantMobile
        ]);
    }
}