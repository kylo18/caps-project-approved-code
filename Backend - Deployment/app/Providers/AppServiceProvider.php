<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\URL;

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
            base_path('Modules/Choices/Database/Migrations'),
            base_path('Modules/FacultySubjects/Database/Migrations'),
            base_path('Modules/Questions/Database/Migrations'),
            base_path('Modules/Users/Database/Migrations'),
            base_path('Modules/Subjects/Database/Migrations'),
            base_path('Modules/PracticeExams/Database/Migrations'),
        ]);

        Schema::defaultStringLength(191);

        \Illuminate\Support\Facades\Request::macro('maxUploadSize', function () {
            return 20 * 1024 * 1024;
        });
    }
}
