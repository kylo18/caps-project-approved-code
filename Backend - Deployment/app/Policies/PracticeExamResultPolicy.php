<?php

namespace App\Policies;

use Modules\PracticeExams\Models\PracticeExamResult;
use Modules\Users\Models\User;

/**
 * Authorization for practice-exam results.
 *
 * Students may only ever see their OWN results; Faculty (2), Program Chair (3),
 * Dean (4) and Associate Dean (5) may view across students. This closes the
 * IDOR / broken-function-level-authorization gaps where any authenticated user
 * could read every student's scores.
 */
class PracticeExamResultPolicy
{
    /**
     * Roles permitted to view results across students.
     */
    public function viewAny(User $user): bool
    {
        return in_array((int) $user->roleID, [2, 3, 4, 5], true);
    }

    /**
     * A single result is viewable by its owner or a privileged role.
     */
    public function view(User $user, PracticeExamResult $result): bool
    {
        return (int) $user->userID === (int) $result->userID
            || $this->viewAny($user);
    }
}
