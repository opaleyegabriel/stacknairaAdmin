<?php

namespace App\Http\Controllers;

use App\Helpers\ActivityLogger;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Contracts\Permission;
use Spatie\Permission\Models\Permission as ModelsPermission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    // public function index()
    // {
    //     return Inertia::render('Roles/index', [
    //         'roles' => Role::all()
    //     ]);
    // }
public function index(Request $request)
    {
        $query = Role::with('permissions')->latest();
        if($request -> has('search') && $request->search != null ){
            $query -> where('name', 'like', '%' . $request ->search . '%');
        }
        $roles = $query->paginate(5) -> toArray();
        // dd($posts);
        ActivityLogger::log('Viewed All Roles', 'Roles');
        return Inertia::render('Roles/index', [
            'roles' => $roles,
        ]);
    }
    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        ActivityLogger::log('Accessed Create Roles Page', 'Roles');
        return Inertia::render('Roles/create', [
            'permissions' => ModelsPermission::pluck('name')
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|unique:roles,name',
            'permissions' => 'required|array',
        ]);

        $role = Role::create(['name' => $request->name]);
        $role->syncPermissions($request->permissions);
        ActivityLogger::log('Created New Role', 'Roles');

        return redirect()->route('roles.index')->with('message', 'Role created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $role = Role::findOrFail($id);
        ActivityLogger::log('Accessed Edit Roles Page', 'Roles');

        return Inertia::render('Roles/edit', [
            'permissions' => ModelsPermission::pluck('name'),
            'role' => $role,
            'rolePermissions' => $role->permissions->pluck('name')
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // dd($request->all());
        $request->validate([
            'name' => 'required|unique:roles,name,' . $id,
            'permissions' => 'required|array',
        ]);
        $role = Role::findOrFail($id);
        $role->name = $request->name;
        $role->syncPermissions($request->permissions);
        $role->save();

        ActivityLogger::log('Update a Role', 'Roles');

        return redirect()->route('roles.index')->with('message', 'Role updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        Role::destroy($id);
        ActivityLogger::log('Deleted A Role', 'Roles');

        // return redirect()->route('roles.index')->with('message', 'Role deleted successfully!');
    }
}
