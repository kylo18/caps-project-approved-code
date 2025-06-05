<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Modules\Users\Models\User;
use Modules\Questions\Models\Status;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First ensure the statuses table exists and has the required statuses
        if (!Schema::hasTable('statuses')) {
            Schema::create('statuses', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->timestamps();
            });

            // Insert default statuses with specific IDs
            DB::table('statuses')->insert([
                ['id' => 1, 'name' => 'pending'],
                ['id' => 2, 'name' => 'approved'],
                ['id' => 3, 'name' => 'disapproved'],
                ['id' => 4, 'name' => 'registered'],
            ]);
        }

        // Add status_id column to users table if it doesn't exist
        if (!Schema::hasColumn('users', 'status_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('status_id')->nullable()->constrained('statuses');
            });

            // Get all users and map their existing status to status_id
            $users = DB::table('users')->get();
            foreach ($users as $user) {
                $statusId = null;
                
                // Map the existing status to the corresponding status_id
                switch (strtolower($user->status)) {
                    case 'pending':
                        $statusId = 1;
                        break;
                    case 'approved':
                        $statusId = 2;
                        break;
                    case 'disapproved':
                        $statusId = 3;
                        break;
                    case 'registered':
                        $statusId = 4;
                        break;
                    default:
                        $statusId = 1; // Default to pending if status is unknown
                }

                // Update the user's status_id
                DB::table('users')
                    ->where('userID', $user->userID)
                    ->update(['status_id' => $statusId]);
            }

            // After successful migration of data, drop the old status column
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add back the status column
        if (!Schema::hasColumn('users', 'status')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('status')->nullable();
            });

            // Migrate data back from status_id to status
            $users = DB::table('users')->get();
            foreach ($users as $user) {
                $status = 'pending';
                switch ($user->status_id) {
                    case 1:
                        $status = 'pending';
                        break;
                    case 2:
                        $status = 'approved';
                        break;
                    case 3:
                        $status = 'disapproved';
                        break;
                    case 4:
                        $status = 'registered';
                        break;
                }

                DB::table('users')
                    ->where('userID', $user->userID)
                    ->update(['status' => $status]);
            }
        }

        // Drop the foreign key constraint and status_id column if they exist
        if (Schema::hasColumn('users', 'status_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['status_id']);
                $table->dropColumn('status_id');
            });
        }

        // Drop the statuses table if it exists
        Schema::dropIfExists('statuses');
    }
};
