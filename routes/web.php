<?php

use App\Http\Controllers\AccumulationPassbookController;
use App\Http\Controllers\AjoGroupsController;
use App\Http\Controllers\ContributionPlansController;
use App\Http\Controllers\CooperativeController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\PassbookController;
use App\Http\Controllers\ReferralController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UsersController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // ===========================
    // 👥 Users
    // ===========================
    Route::middleware('permission:create_users')->group(function () {
        Route::get('users/create', [UsersController::class, 'create'])->name('users.create');
        Route::post('users', [UsersController::class, 'store'])->name('users.store');
    });

    Route::middleware('permission:edit_users')->group(function () {
        Route::get('users/{user}/edit', [UsersController::class, 'edit'])->name('users.edit')->whereNumber('user');
        Route::put('users/{user}', [UsersController::class, 'update'])->name('users.update')->whereNumber('user');
    });

    Route::middleware('permission:view_users')->group(function () {
        Route::get('users', [UsersController::class, 'index'])->name('users.index');
        Route::get('users/{user}', [UsersController::class, 'show'])->name('users.show')->whereNumber('user');
    });

    Route::middleware('permission:delete_users')->group(function () {
        Route::delete('users/{user}', [UsersController::class, 'destroy'])->name('users.destroy')->whereNumber('user');
    });

    // ===========================
    // 🛡️ Roles
    // ===========================
    Route::middleware('permission:create_roles')->group(function () {
        Route::get('roles/create', [RoleController::class, 'create'])->name('roles.create');
        Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
    });

    Route::middleware('permission:edit_roles')->group(function () {
        Route::get('roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit')->whereNumber('role');
        Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update')->whereNumber('role');
    });

    Route::middleware('permission:view_roles')->group(function () {
        Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
        Route::get('roles/{role}', [RoleController::class, 'show'])->name('roles.show')->whereNumber('role');
    });

    Route::middleware('permission:delete_roles')->group(function () {
        Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy')->whereNumber('role');
    });

    // ===========================
    // 👥 Members
    // ===========================
    Route::middleware('permission:view_members')->group(function () {
        Route::get('members', [MemberController::class, 'index'])->name('members.index');
            // Statement & Financial
        Route::get('members/{member}/financial-summary', [MemberController::class, 'financialSummary'])->name('members.financial-summary');
        Route::get('members/{member}/transactions', [MemberController::class, 'transactions'])->name('members.transactions');
        Route::get('members/{member}/statement', [MemberController::class, 'generateStatement'])->name('members.generate-statement');
        Route::get('members/{member}/statement-data', [MemberController::class, 'getStatementData'])->name('members.statement-data');
        
        // Referrals & Network
        Route::get('members/{member}/referrals', [MemberController::class, 'referrals'])->name('members.referrals');
        
        // Ajo Groups
        Route::get('members/{member}/ajo-groups', [MemberController::class, 'ajoGroups'])->name('members.ajo-groups');
    });
    Route::middleware('permission:view_members_details')->group(function () {
        Route::get('members/{member}', [MemberController::class, 'show'])->name('members.show');
    });
        

    Route::middleware('permission:edit_members_photo')->group(function () {
        Route::post('members/{member}/photo', [MemberController::class, 'updatePhoto'])->name('members.update-photo');
        Route::delete('members/{member}/photo', [MemberController::class, 'removePhoto'])->name('members.remove-photo');
    });

    // Member Management
    Route::middleware('permission:edit_members_photo')->group(function () {
        Route::patch('members/{member}/status', [MemberController::class, 'updateStatus'])->name('members.update-status');
    });

        // Statement preview page
    Route::get('members/{member}/statement-preview', [MemberController::class, 'statementPreview'])->name('members.statement-preview');


    // routes/web.php
    Route::middleware('permission:edit_members_name')->group(function () {
        Route::patch('/members/{member}/update-name', [MemberController::class, 'updateName'])->name('members.update-name');
    });
    Route::middleware('permission:edit_members_email')->group(function () {
        Route::patch('/members/{member}/update-email', [MemberController::class, 'updateEmail'])->name('members.update-email');
    });

    Route::middleware('permission:edit_members_phone')->group(function () {
        Route::patch('/members/{member}/update-phone', [MemberController::class, 'updatePhone'])->name('members.update-phone');
    });

    Route::middleware('permission:edit_members_category')->group(function () {
        Route::get('/members/{member}/setups', [MemberController::class, 'getSetups'])->name('members.setups');
        Route::patch('/members/{member}/update-category', [MemberController::class, 'updateCategory'])->name('members.update-category');
    });

    Route::middleware('permission:edit_members_account')->group(function () {
        Route::patch('/members/{member}/update-account', [MemberController::class, 'updateAccount'])->name('members.update-account');
    });

    // ===========================
    // 🤝 Cooperative
    // ===========================
    Route::middleware('permission:view_cooperative')->group(function () {
        Route::get('cooperative', [CooperativeController::class, 'index'])->name('cooperative.index');
    });
    Route::middleware('permission:view_cooperative_details')->group(function () {
        Route::get('cooperative/{id}', [CooperativeController::class, 'show'])->name('cooperative.show');
        Route::get('cooperative/statistics', [CooperativeController::class, 'statistics'])->name('cooperative.statistics');
    });

        // Contribution Plans
    Route::middleware('permission:view_ajo_single')->group(function () {
        Route::get('contribution-plans', [ContributionPlansController::class, 'index'])->name('contribution-plans.index');
        Route::get('contribution-plans/{id}', [ContributionPlansController::class, 'show'])->name('contribution-plans.show');
        Route::get('contribution-plans/statistics', [ContributionPlansController::class, 'statistics'])->name('contribution-plans.statistics');
    });


    // ===========================
    // 🔄 AJO Groups
    // ===========================
    
    // Main groups listing
    Route::middleware('permission:view_ajo_group')->group(function () {
        Route::get('ajo-groups', [AjoGroupsController::class, 'index'])->name('ajo-groups.index');
    
        // Group details
        Route::get('ajo-groups/{id}', [AjoGroupsController::class, 'show'])->name('ajo-groups.show');
        // Members with AJO groups
        Route::get('ajo-groups-members', [AjoGroupsController::class, 'members'])->name('ajo-groups.members');
        
        // Statistics
        Route::get('ajo-groups-statistics', [AjoGroupsController::class, 'statistics'])->name('ajo-groups.statistics');
        
        // Export reports
        Route::get('ajo-groups-export', [AjoGroupsController::class, 'exportReport'])->name('ajo-groups.export');
        
        // API endpoints for specific group data
        Route::get('ajo-groups/{id}/members', [AjoGroupsController::class, 'groupMembers'])->name('ajo-groups.group-members');
        Route::get('ajo-groups/{id}/contributions', [AjoGroupsController::class, 'groupContributions'])->name('ajo-groups.group-contributions');
        Route::get('ajo-groups/{id}/payouts', [AjoGroupsController::class, 'groupPayouts'])->name('ajo-groups.group-payouts');

        // Member-specific AJO data
        Route::get('member/{memberId}/ajo-groups', [AjoGroupsController::class, 'memberGroups'])->name('member-groups');
        Route::get('member/{memberId}/ajo-summary', [AjoGroupsController::class, 'memberAjoSummary'])->name('member-summary');
        
    });


    Route::middleware('permission:view_referrals')->group(function () {
        Route::get('/referrals', [ReferralController::class, 'index'])->name('referrals.index');
        Route::get('/referrals/statistics', [ReferralController::class, 'statistics'])->name('referrals.statistics');
    });

    // routes/web.php
    Route::middleware('permission:view_cooperative')->group(function () {
        Route::get('/passbook', [PassbookController::class, 'index'])->name('passbook.index');
        Route::get('/passbook/{id}', [PassbookController::class, 'show'])->name('passbook.show');
        Route::get('/passbook/{id}/schedule', [PassbookController::class, 'schedule'])->name('passbook.schedule');
        Route::get('/passbook/{id}/export', [PassbookController::class, 'exportPdf'])->name('passbook.export');
    });
    Route::middleware('permission:view_cooperative')->group(function () {
        Route::get('/accumulation-passbook', [AccumulationPassbookController::class, 'index'])->name('accumulation-passbook.index');
        Route::get('/accumulation-passbook/{id}', [AccumulationPassbookController::class, 'show'])->name('accumulation-passbook.show');
        Route::get('/accumulation-passbook/{id}/export', [AccumulationPassbookController::class, 'exportPdf'])->name('accumulation-passbook.export');    
    });

});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';