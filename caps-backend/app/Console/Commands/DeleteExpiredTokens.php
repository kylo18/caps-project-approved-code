<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Laravel\Sanctum\PersonalAccessToken;
use Carbon\Carbon;

class DeleteExpiredTokens extends Command
{
    protected $signature = 'tokens:cleanup';
    protected $description = 'Delete expired personal access tokens';

    public function handle()
    {
        $expired = PersonalAccessToken::where('expires_at', '<', Carbon::now())->delete();
        $this->info("Expired tokens deleted: {$expired}");
    }
}
