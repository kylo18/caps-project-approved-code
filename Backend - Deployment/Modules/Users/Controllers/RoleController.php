<?php

namespace Modules\Users\Controllers;

use Illuminate\Routing\Controller;
use Modules\Users\Models\User;
use Modules\Users\Models\Role;

class RoleController extends Controller
{
    public function indexAvailableRoles()
    {
        try {
            // Count existing Deans (roleID = 4)
            $deanCount = User::where('roleID', 4)->count();

            // Get all roles
            $rolesQuery = Role::query();

            // Exclude Dean if count is already 2 or more
            if ($deanCount >= 2) {
                $rolesQuery->where('roleID', '!=', 4);
            }

            $roles = $rolesQuery->get();

            return response()->json([
                'message' => 'Available roles retrieved successfully.',
                'roles' => $roles
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching roles.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
