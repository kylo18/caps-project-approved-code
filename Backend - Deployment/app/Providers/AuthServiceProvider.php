<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Modules\Users\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array
     */
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Define Gates for Role-Based Access Control (RBAC)
        Gate::define('is-student', function (User $user) {
            return $user->role === 'student';
        });

        Gate::define('is-instructor', function (User $user) {
            return $user->role === 'instructor';
        });

        Gate::define('is-program-chair', function (User $user) {
            return $user->role === 'program-chair';
        });

        Gate::define('is-dean', function (User $user) {
            return $user->role === 'dean'; // Admin Role
        });

        // Admins have full access
        Gate::define('is-admin', function (User $user) {
            return in_array($user->role, ['dean', 'program-chair']);
        });

        $this->registerPolicies();

        ResetPassword::createUrlUsing(function ($user, string $token) {
            return config('app.frontend_url') . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);
        });
    }
}
