<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\RoleMiddleware;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * Define your route model bindings, pattern filters, etc.
     */
    public function boot()
    {
        parent::boot();

        $this->routes(function () {
            Route::prefix('api')
                ->middleware('api')
                ->group(base_path('routes/api.php'));

            /*Route::middleware('web')
                ->group(base_path('routes/web.php'));*/
        });

        $this->app->singleton('role', function ($app) {
            return new RoleMiddleware();
        });
        $this->loadRoutesFrom(base_path('routes/api.php'));
    }
}
