<?php

namespace App\Http\Controllers;

use App\Helpers\ActivityLogger;
use App\Models\User;
use App\Models\State;
use App\Models\Location;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

class UsersController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['roles'])
            ->latest();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%")
                    ->orWhere('phone', 'like', "%{$request->search}%");
            });
        }

        $users = $query->paginate(10);
        ActivityLogger::log('Viewed All Users', 'Users');

        return Inertia::render('Users/index', [
            'users' => $users,
        ]);
    }

    public function create()
    {
        ActivityLogger::log('Accessed Create Users Page', 'Users');

        return Inertia::render('Users/create', [
            'roles' => Role::pluck('name'),
            'currentUser' => Auth::user(),
            'states' => State::all(),
            'locations' => Location::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8|confirmed',
            'status' => 'required|string|in:0,1',
            'state_id' => 'nullable|exists:state,id',
            'location_id' => 'nullable|exists:locations,id',
            'accessible_states' => 'nullable|array',
            'accessible_locations' => 'nullable|array',
        ]);

        $validated['password'] = bcrypt($validated['password']);

        $user = User::create($validated);
        $user->syncRoles($request->roles);

        // Sync multiple states and locations
        if ($request->has('accessible_states')) {
            $user->accessibleStates()->sync($request->accessible_states);
        }

        if ($request->has('accessible_locations')) {
            $user->accessibleLocations()->sync($request->accessible_locations);
        }

        ActivityLogger::log('Created New User', 'Users');
        return redirect()->route('users.index')->with('message', 'User created successfully.');
    }

    public function show(User $user)
    {
        //
    }

    public function edit(User $user)
    {
        ActivityLogger::log('Accessed Edit Users Page', 'Users');
        
        return Inertia::render('Users/edit', [
            'userData' => $user->load(['accessibleStates', 'accessibleLocations']),
            'userRoles' => $user->roles->pluck('name'),
            'roles' => Role::pluck('name'),
            'currentUser' => Auth::user(),
            'states' => State::all(),
            'locations' => Location::all(),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['required', 'string', 'max:255'],
            'status' => ['required', 'in:0,1'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'state_id' => 'nullable|exists:state,id',
            'location_id' => 'nullable|exists:locations,id',
            'accessible_states' => 'nullable|array',
            'accessible_locations' => 'nullable|array',
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'status' => $request->status,
            'state_id' => $request->state_id,
            'location_id' => $request->location_id,
            'password' => $request->filled('password')
                ? Hash::make($request->password)
                : $user->password,
        ]);

        $user->syncRoles($request->roles);

        // Sync multiple states and locations
        $user->accessibleStates()->sync($request->accessible_states ?? []);
        $user->accessibleLocations()->sync($request->accessible_locations ?? []);

        ActivityLogger::log('Updated A Users', 'Users');
        return to_route('users.index')->with('message', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        if ($user->image) {
            Storage::disk('public')->delete($user->image);
        }
        ActivityLogger::log('Delete a User', 'Users');

        $user->delete();
    }
}