<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot()
    {
        $this->loadMigrationsFrom([
            base_path('Modules/Users/Database/Migrations'),
            base_path('Modules/Subjects/Database/Migrations'),
            base_path('Modules/Exams/Database/Migrations'),
            base_path('Modules/Requests/Database/Migrations'),
            base_path('Modules/Printing/Database/Migrations'),
            base_path('Modules/Practice/Database/Migrations'),
            base_path('Modules/Notifications/Database/Migrations'),
            base_path('Modules/Choices/Database/Migrations'),
            base_path('Modules/Exams/Database/Migrations'),
        ]);

        Schema::defaultStringLength(191);

        // Increase request size limit
        \Illuminate\Support\Facades\Request::macro('maxUploadSize', function () {
            return 20 * 1024 * 1024;
        });
    }
}
