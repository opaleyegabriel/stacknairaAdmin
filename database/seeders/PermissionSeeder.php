<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            'view_roles',
            'create_roles',
            'edit_roles',
            'delete_roles',
            // 'edit_members',
            // 'delete_members',
            // 'edit_members_photo',
            // 'edit_members_details',
            // 'edit_members_category',
            // 'view_cooperative',
            // 'view_ajo_single',
            // 'view_referrals'

            // Add more permissions as needed
        ];
        foreach ($permissions as $value) {
            Permission::create(['name' => $value]);
        }
    }   
}
