<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Gate;
use Illuminate\Database\Eloquent\Relations\Relation;
use Modules\PracticeExams\Models\PracticeExamResult;
use App\Policies\PracticeExamResultPolicy;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Add explicit model binding for YearLevel
        $this->app->bind('Modules\YearLevels\Models\YearLevel', 'Modules\Subjects\Models\YearLevel');
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
            base_path('Modules/Semester/Database/Migrations'),
            base_path('Modules/PersonalExams/Database/Migrations'),
            base_path('Modules/PersonalClasses/Database/Migrations'),
            base_path('Modules/Leaderboard/Database/Migrations'),
            base_path('Modules/Analytics/Database/Migrations'),
            base_path('Modules/Achievements/Database/Migrations'),
            base_path('Modules/Support/Database/Migrations'),
            base_path('Modules/Notifications/Database/Migrations'),
        ]); 


        Schema::defaultStringLength(191);

        \Illuminate\Support\Facades\Request::macro('maxUploadSize', function () {
            return 20 * 1024 * 1024;
        });

        // Add morphMap for YearLevel model
        Relation::morphMap([
            'year_level' => 'Modules\Subjects\Models\YearLevel',
        ]);

        // Authorization policies
        Gate::policy(PracticeExamResult::class, PracticeExamResultPolicy::class);

        if (env('APP_ENV') !== 'local') {
            URL::forceScheme('https');
        }
    }
}
