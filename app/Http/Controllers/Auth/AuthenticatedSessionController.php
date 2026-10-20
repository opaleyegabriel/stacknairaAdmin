<?php

// namespace App\Http\Controllers\Auth;

// use App\Helpers\ActivityLogger;
// use App\Http\Controllers\Controller;
// use App\Http\Requests\Auth\LoginRequest;
// use Illuminate\Http\RedirectResponse;
// use Illuminate\Http\Request;
// use Illuminate\Support\Facades\Auth;
// use Illuminate\Support\Facades\Route;
// use Inertia\Inertia;
// use Inertia\Response;
// use Laravel\Fortify\Features;

// class AuthenticatedSessionController extends Controller
// {
//     /**
//      * Show the login page.
//      */
//     public function create(Request $request): Response
//     {
//         return Inertia::render('auth/login', [
//             'canResetPassword' => Route::has('password.request'),
//             'status' => $request->session()->get('status'),
//         ]);
//     }

//     /**
//      * Handle an incoming authentication request.
//      */
//     public function store(LoginRequest $request): RedirectResponse
//     {
//         $user = $request->validateCredentials();

//         // if (Features::enabled(Features::twoFactorAuthentication()) && $user->hasEnabledTwoFactorAuthentication()) {
//         //     $request->session()->put([
//         //         'login.id' => $user->getKey(),
//         //         'login.remember' => $request->boolean('remember'),
//         //     ]);

//         //     return to_route('two-factor.login');
//         // }


//                 Auth::login($user, $request->boolean('remember'));
//         ActivityLogger::log('User Logged In', 'Auth');

//         return redirect()->intended('/dashboard');
//     }
    

//     /**
//      * Destroy an authenticated session.
//      */
//     public function destroy(Request $request): RedirectResponse
//     {
//         Auth::guard('web')->logout();

//         $request->session()->invalidate();
//         $request->session()->regenerateToken();

//         return redirect('/');
//     }
// }

namespace App\Http\Controllers\Auth;

use App\Helpers\ActivityLogger;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $user = $request->validateCredentials();

        if (!$user) {
            return back()->withErrors([
                'login' => 'These credentials do not match our records.',
            ]);
        }

        Auth::login($user, $request->boolean('remember'));
        
        // Log the activity
        ActivityLogger::log('User Logged In', 'Auth');

        // Check if this is a newly created merchant user
        if ($user->wasRecentlyCreated) {
            ActivityLogger::log('New merchant user account created and assigned merchant role', 'Auth');
            
            // You can add additional logic here for new merchant users
            // For example, send welcome email, assign specific permissions, etc.
        }

        return redirect()->intended('/dashboard');
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        ActivityLogger::log('User Logged Out', 'Auth');
        
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}