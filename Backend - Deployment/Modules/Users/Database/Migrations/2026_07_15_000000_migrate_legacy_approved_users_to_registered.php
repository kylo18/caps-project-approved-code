<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Converge legacy user accounts on the current good-status.
 *
 * Before the social-auth feature, an approved user carried the "approved"
 * status (id 2). The current approval flow assigns "registered" (id 4) instead,
 * so pre-existing users were stranded on "approved" and rejected by Google
 * auto-linking (SocialAuthController requires the "registered" status).
 *
 * This moves those legacy USER rows to "registered". The shared "approved"
 * status is left in place because it is still used by questions.
 */
return new class extends Migration {
    public function up()
    {
        $approvedStatusId = DB::table('statuses')->where('name', 'approved')->value('id');
        $registeredStatusId = DB::table('statuses')->where('name', 'registered')->value('id');

        if (!$approvedStatusId || !$registeredStatusId) {
            return;
        }

        DB::table('users')
            ->where('status_id', $approvedStatusId)
            ->update(['status_id' => $registeredStatusId]);
    }

    public function down()
    {
        // Irreversible: once migrated we cannot distinguish users that were
        // originally "registered" from those converted here, so we do not
        // move any rows back to the legacy "approved" status.
    }
};
