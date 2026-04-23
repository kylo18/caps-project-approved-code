<?php
use Modules\Analytics\Controllers\AnalyticsController;
use App\Http\Middleware\TokenExpirationMiddleware;
use Illuminate\Support\Facades\Route;
use Modules\Users\Controllers\AuthController;

use Modules\Subjects\Controllers\SubjectController;
use Modules\FacultySubjects\Controllers\FacultySubjectController;
use Modules\Questions\Controllers\QuestionController;
use Modules\Choices\Controllers\ChoiceController;
use Modules\Users\Controllers\UserController;
use Modules\PracticeExams\Controllers\PracticeExamSettingController;
use Modules\PracticeExams\Controllers\PracticeExamController;
use Modules\PracticeExams\Controllers\PracticeExamLeaderboardController;
use Modules\Users\Controllers\ProgramController;
use Modules\Users\Controllers\RoleController;
use Modules\Users\Controllers\PasswordResetController;
use Modules\App\Controllers\AppController;
use Modules\Print\Controllers\PrintController;
use Modules\Subjects\Controllers\YearLevelController;
use Modules\PracticeExams\Controllers\PersonalExamSettingController;
use Modules\Users\Controllers\StudentTeacherEnrollmentController;
use Modules\Leaderboard\Controllers\LeaderboardController;
use Modules\Users\Controllers\SystemNotificationController;
use Modules\Users\Controllers\SocialAuthController;
use Modules\Analytics\Controllers\AdminAnalyticsController;
use Modules\Analytics\Controllers\StudentAnalyticsController;
use Modules\Support\Controllers\AIController;
use Modules\Support\Controllers\SupportController;
use Modules\Notifications\Controllers\NotificationController;
// New imports: these controllers were referenced in routes below but had no use statements,
// causing "Class does not exist" errors at runtime (artisan route:list crashed).
use Modules\PersonalExams\Controllers\PersonalQuizController;
use Modules\PersonalExams\Controllers\PersonalQuizLeaderboardController;
use Modules\PersonalExams\Controllers\PersonalQuizQuestionController;
use Modules\PersonalExams\Controllers\PersonalQuizChoiceController;
use Modules\PersonalExams\Controllers\PersonalQuizSettingController;
use Modules\PersonalExams\Controllers\QuizSessionController;
use Modules\PersonalExams\Controllers\StudentQuizController;
use Modules\PersonalExams\Controllers\StudentQuizResultController;
use Modules\PersonalClasses\Controllers\ClassController;
use Modules\PersonalClasses\Controllers\ClassPersonalQuizController;
use Modules\PersonalClasses\Controllers\ClassEnrollmentController;

/*
|--------------------------------------------------------------------------
| Public API Routes (No authentication required)
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/roles', [RoleController::class, 'indexAvailableRoles']);
Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLinkEmail']);
Route::post('/reset-password', [PasswordResetController::class, 'reset']);
Route::get('/app-version', [AppController::class, 'getVersion']);


/*
|--------------------------------------------------------------------------
| Social Authentication Routes (No authentication required)
|--------------------------------------------------------------------------
*/
Route::get('/auth/google/redirect', [SocialAuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback']);
Route::post('/auth/social/verify-link', [SocialAuthController::class, 'verifyLink']);
Route::get('/auth/facebook/redirect', [SocialAuthController::class, 'redirectToFacebook']);
Route::get('/auth/facebook/callback', [SocialAuthController::class, 'handleFacebookCallback']);

// Backward compatibility routes for older frontends
Route::get('/auth/google', [SocialAuthController::class, 'redirectToGoogle']);
Route::get('/auth/facebook', [SocialAuthController::class, 'redirectToFacebook']);

/*
|--------------------------------------------------------------------------
| Leaderboard Route (No authentication required)
|--------------------------------------------------------------------------
*/
Route::get('/leaderboard', [LeaderboardController::class, 'index']);

// Temporary route to clear cache
Route::get('/clear-cache', function() {
    \Illuminate\Support\Facades\Artisan::call('cache:clear');
    \Illuminate\Support\Facades\Artisan::call('config:clear');
    \Illuminate\Support\Facades\Artisan::call('view:clear');
    if (function_exists('opcache_reset')) {
        opcache_reset();
    }
    return response()->json(['message' => 'Cache cleared successfully']);
});

// Test route to verify Redis is working
Route::get('/test-redis', function() {
    try {
        \Illuminate\Support\Facades\Redis::set('test', 'Hello Redis from Docker!');
        $value = \Illuminate\Support\Facades\Redis::get('test');
        return response()->json([
            'status' => 'success',
            'message' => 'Redis is working correctly!',
            'value' => $value,
            'driver' => config('cache.default')
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage()
        ], 500);
    }
});

/*
|--------------------------------------------------------------------------
| Support Routes (Public - FAQs)
|--------------------------------------------------------------------------
*/
Route::get('/support/faqs', [SupportController::class, 'getFaqs']);
Route::get('/support/categories', [SupportController::class, 'getCategories']);

/*
|--------------------------------------------------------------------------
| Class Enrollment (Public - join by invite link, requires auth)
| NEW: wired up ClassEnrollmentController joinByLink so students can join
| classes via an invite URL without needing a class code.
|--------------------------------------------------------------------------
*/
Route::get('/classes/join/{token}', [ClassEnrollmentController::class, 'joinByLink']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes (All roles)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {
    // User profile and authentication
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user/profile', [UserController::class, 'getProfile']);
    Route::post('/user/update-profile', [UserController::class, 'updateProfile']);

// --- FROM HEAD ---
    // Student Analytics Routes (Role 1 only)
    Route::middleware(['role:1'])->group(function () {
        Route::get('/student/analytics/summary', [StudentAnalyticsController::class, 'getSummary']);
        Route::get('/student/analytics/insights', [StudentAnalyticsController::class, 'getInsights']);
        Route::get('/student/analytics/trends', [StudentAnalyticsController::class, 'getPerformanceTrends']);
        Route::get('/student/analytics/frequently-mistaken', [StudentAnalyticsController::class, 'getFrequentlyMistaken']);
    });

    // Notification Routes (All authenticated users)
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // --- FROM INCOMING ---
    // All subjects
    Route::get('/subjects/all', [SubjectController::class, 'allSubjects']);
    Route::get('/subjects', [SubjectController::class, 'index']);

    // Practice Exam Results & Leaderboards
    Route::get('/practice-exam/results/{subjectID}', [PracticeExamController::class, 'subjectExamResults']);
    Route::get('/results/all-students', [PracticeExamController::class, 'getAllExamResults']);
    Route::get('/practice-exam/leaderboard/{subjectID}', [PracticeExamLeaderboardController::class, 'leaderboard']);
    Route::get('/practice-exam/recent-takers/{subjectID}', [PracticeExamLeaderboardController::class, 'recentTakers']);
    Route::get('/practice-exam/overall-leaderboard', [PracticeExamLeaderboardController::class, 'overallLeaderboard']);
    Route::get('/practice-exam/overall-recent-takers', [PracticeExamLeaderboardController::class, 'overallRecentTakers']);

    // Year Levels & Analytics
    Route::get('/year-levels', [YearLevelController::class, 'index']);
    Route::get('/practice-exam/content-analytics', [AnalyticsController::class, 'getPracticeContentAnalytics']);
    Route::get('/practice-exam/difficulty-analytics', [AnalyticsController::class, 'getPracticeDifficultyAnalytics']);

    // Classes & Quizzes
    Route::get('/classes/{classID}/quizzes', [ClassPersonalQuizController::class, 'index']);
    Route::get('/classes/index', [ClassController::class, 'index']);
    // Register static class routes before dynamic /classes/{classID}
    // to avoid "my-classes" being interpreted as {classID}.
    Route::get('/classes/my-classes', [ClassEnrollmentController::class, 'myClasses']);
    Route::get('/my-classes', [ClassEnrollmentController::class, 'myClasses']);
    Route::post('/classes', [ClassController::class, 'store']);
    Route::get('/classes/{classID}', [ClassController::class, 'show']);
    Route::put('/classes/{classID}', [ClassController::class, 'update']);
    Route::patch('/classes/{classID}/archive', [ClassController::class, 'archive']);
    Route::patch('/classes/archive/{classID}', [ClassController::class, 'archive']); // Alias for Archive button

    // Class Enrollment (Faculty - view enrolled students)
    // NEW: wired up ClassEnrollmentController index so faculty can see who's in their class.
    Route::get('/classes/{classID}/enrollments', [ClassEnrollmentController::class, 'index']);
    // Alias for older / alternate frontends that call /students instead of /enrollments.
    Route::get('/classes/{classID}/students', [ClassEnrollmentController::class, 'index']);

    // Customer Support (Keeping the Jdev version)
    Route::post('/support-tickets', [\Modules\Support\Controllers\SupportTicketController::class, 'store']);
    Route::get('/support-tickets/me', [\Modules\Support\Controllers\SupportTicketController::class, 'myTickets']);
});
/*
|--------------------------------------------------------------------------
| Routes for Faculty (roleID: 2), Program Chair (roleID: 3), Dean (roleID: 4), and Associate Dean (roleID: 5)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', TokenExpirationMiddleware::class, 'role:2,3,4,5'])->group(function () {
    // User management
    Route::get('/users', [UserController::class, 'index']);
    Route::patch('/users/{userID}/approve', [UserController::class, 'approveUser']);
    Route::patch('/users/{userID}/disapprove', [UserController::class, 'disapproveUser']);
    Route::post('/users/approve-multiple', [UserController::class, 'approveMultipleUsers']);
    Route::post('/users/activate-multiple', [UserController::class, 'activateMultipleUsers']);
    Route::post('/users/deactivate-multiple', [UserController::class, 'deactivateMultipleUsers']);
    Route::patch('users/{id}/deactivate', [UserController::class, 'deactivate']);
    Route::patch('users/{id}/activate', [UserController::class, 'activate']);

    // Choices
    Route::post('/questions/choices', [ChoiceController::class, 'store']);
    Route::get('/questions/{questionID}/choices', [ChoiceController::class, 'showChoices']);

    // Subjects (Restricted operations like assignment)
    Route::post('/faculty/assign-subject', [FacultySubjectController::class, 'assignSubject']);
    Route::get('/faculty/my-subjects', [FacultySubjectController::class, 'mySubjects']);
    Route::get('/faculty/availableSubjects', [FacultySubjectController::class, 'availableSubjects']);
    Route::delete('/remove-assigned-subject/{subjectID}', [FacultySubjectController::class, 'removeAssignedSubject']);

    // Questions
    Route::post('/questions/add', [QuestionController::class, 'store']);
    Route::get('/questions/count', [QuestionController::class, 'questionCount']);
    Route::get('/questions/{questionID}', [QuestionController::class, 'show'])->whereNumber('questionID');
    Route::get('/subjects/{subjectID}/questions', [QuestionController::class, 'indexQuestions']);
    Route::post('/questions/update/{questionID}', [QuestionController::class, 'update']);
    Route::delete('/questions/delete/{questionID}', [QuestionController::class, 'destroy']);
    Route::get('/faculty/my-questions/{subjectID}', [QuestionController::class, 'mySubjectQuestions']);
    Route::post('/choices/update', [ChoiceController::class, 'updateChoices']);
    Route::post('/questions/{questionID}/duplicate', [QuestionController::class, 'duplicate']);

    // Printable exam (PDF preview/download)
    Route::post('/generate-printable-exam/{subjectID}', [PrintController::class, 'generatePrintableExam']);


    // Personal Quiz PDF Generation (Faculty only)
    Route::get('/personal-quiz/{personalQuizID}/questions', [PrintController::class, 'getPersonalQuizQuestions']);
    Route::post('/generate-personal-quiz-pdf', [PrintController::class, 'generatePersonalQuizPDF']);


    // Practice exam preview (Dean/Chair/Instructor can preview)
    Route::get('/practice-exam/preview/{subjectID}', [PracticeExamController::class, 'previewPracticeExam']);

    // Single-subject personal questions preview (Quiz)
    Route::post('/generate-single-subject-personal-preview', [PrintController::class, 'generateSingleSubjectPersonalPreview']);

    // Programs listing
    Route::get('/programs', [ProgramController::class, 'index']);


    // Personal Quizzes (Libraries)
    Route::post('/personal-quizzes', [PersonalQuizController::class, 'store']);
    Route::get('/personal-quizzes', [PersonalQuizController::class, 'index']);
    Route::get('/personal-quizzes/archived', [PersonalQuizController::class, 'archived']);
    Route::put('/update-personal-quizzes/{personalQuizID}', [PersonalQuizController::class, 'update']);
    Route::patch('/personal-quizzes/{personalQuizID}/archive', [PersonalQuizController::class, 'archive']);
    Route::patch('/personal-quizzes/{personalQuizID}/unarchive', [PersonalQuizController::class, 'unarchive']);
    Route::delete('/personal-quizzes/{personalQuizID}', [PersonalQuizController::class, 'destroy']);

    // Personal Quiz Leaderboard and Recent Takers
    Route::get('/personal-quiz/{personalQuizID}/leaderboard', [PersonalQuizLeaderboardController::class, 'leaderboard']);
    Route::get('/personal-quiz/{personalQuizID}/recent-takers', [PersonalQuizLeaderboardController::class, 'recentTakers']);

    // Personal Quiz Questions
    Route::get('/personal-quiz-questions/{personalQuizID}', [PersonalQuizQuestionController::class, 'index']);
    Route::post('/personal-quiz-questions', [PersonalQuizQuestionController::class, 'store']);
    Route::post('/personal-quiz-questions/import', [PersonalQuizQuestionController::class, 'import']);
    Route::post('/personal-quiz-questions/{personalQuizQuestionID}', [PersonalQuizQuestionController::class, 'update']);
    Route::post('/personal-quiz-questions/{personalQuizQuestionID}/duplicate', [PersonalQuizQuestionController::class, 'duplicate']);
    Route::delete('/personal-quiz-questions/{personalQuizQuestionID}', [PersonalQuizQuestionController::class, 'destroy']);

    // Personal Quiz Choices
    Route::get('/personal-quiz-choices/{personalQuizQuestionID}', [PersonalQuizChoiceController::class, 'show']);
    Route::post('/personal-quiz-choices', [PersonalQuizChoiceController::class, 'store']);
    Route::put('/personal-quiz-choices', [PersonalQuizChoiceController::class, 'updateChoices']);
    Route::post('/personal-quiz-choices/update', [PersonalQuizChoiceController::class, 'updateChoices']);
    Route::delete('/personal-quiz-choices/{personalQuizChoiceID}', [PersonalQuizChoiceController::class, 'destroy']);

    // Class Personal Quiz Settings
    Route::get('/class-quizzes/{classPersonalQuizID}/settings', [PersonalQuizSettingController::class, 'show']);
    Route::post('/class-quizzes/{classPersonalQuizID}/settings', [PersonalQuizSettingController::class, 'store']);
    Route::put('/class-quizzes/{classPersonalQuizID}/settings', [PersonalQuizSettingController::class, 'update']);
    Route::delete('/class-quizzes/{classPersonalQuizID}/settings', [PersonalQuizSettingController::class, 'destroy']);

    // Personal Exam Settings
    Route::post('/personal-exam-settings', [PracticeExamSettingController::class, 'store']);
    Route::get('/personal-exam-settings/{subjectID}', [PracticeExamSettingController::class, 'show']);


    // Get all students enrolled under the authenticated teacher
    Route::get('/my-students', [StudentTeacherEnrollmentController::class, 'myStudents']);

    // Get exam questions status
    Route::get('/subjects/{subjectID}/exam-questions-status', [SubjectController::class, 'getExamQuestionsStatus']);


    // Image upload for subjects (admin/faculty only)
    Route::post('/subjects/{id}/upload-image', [SubjectController::class, 'uploadSubjectImage']);

    // REMOVED duplicate practice-exam leaderboard/recent-takers routes.
    // These were already registered in the "all authenticated users" group above (lines ~140-141).
    // The duplicates here were unreachable because Laravel matches the first registered route,
    // so the TokenExpirationMiddleware on this faculty-only group never fired for these endpoints.
    // Class Enrollment (Faculty - remove student from class)
    // NEW: wired up ClassEnrollmentController removeStudent.
    Route::post('/classes/{classID}/enrollments/remove', [ClassEnrollmentController::class, 'removeStudent']);
    // Alias: DELETE + JSON body (some frontends use this instead of POST .../enrollments/remove).
    Route::delete('/classes/{classID}/remove-student', [ClassEnrollmentController::class, 'removeStudent']);

    // System notification for bulk updates (Dean and Associate Dean only)
    Route::post('/admin/system/notify-update', [SystemNotificationController::class, 'sendSystemUpdate']);

    // Admin Analytics Routes (Role 2-5)
    Route::get('/admin/analytics/summary', [AdminAnalyticsController::class, 'getSummary']);
    Route::get('/admin/analytics/average-score-per-subject', [AdminAnalyticsController::class, 'getAverageScorePerSubject']);
    Route::get('/admin/analytics/student-progress', [AdminAnalyticsController::class, 'getStudentProgress']);
    Route::get('/admin/analytics/pass-fail-rate', [AdminAnalyticsController::class, 'getPassFailRate']);
    Route::get('/admin/analytics/improvement-percentage', [AdminAnalyticsController::class, 'getImprovementPercentage']);
    Route::get('/admin/analytics/topic-mastery', [AdminAnalyticsController::class, 'getTopicMastery']);
    Route::get('/admin/analytics/content', [AdminAnalyticsController::class, 'getContentAnalytics']);


    // Admin Support Ticket Management Routes (Role 3-5)
    Route::get('/admin/support/tickets', [SupportController::class, 'getAdminTickets']);
    Route::get('/admin/support/tickets/{id}', [SupportController::class, 'getAdminTicket']);
    Route::patch('/admin/support/tickets/{id}', [SupportController::class, 'updateTicket']);

    // Admin Notification Creation Routes (Role 4-5)
    Route::post('/admin/notifications', [NotificationController::class, 'create']);

    // Class Personal Quizzes (Faculty)
    Route::get('/classes/{classID}/quizzes/available', [ClassPersonalQuizController::class, 'availablePersonalQuizzes']);
    Route::post('/classes/quizzes', [ClassPersonalQuizController::class, 'store']);
    Route::put('/classes/quizzes/{classPersonalQuizID}', [ClassPersonalQuizController::class, 'update']);
    Route::patch('/classes/quizzes/{classPersonalQuizID}/dates', [ClassPersonalQuizController::class, 'updateDates']);
    Route::delete('/classes/quizzes/{classPersonalQuizID}', [ClassPersonalQuizController::class, 'destroy']);

    // Personal Quiz to Classes Assignment (Faculty)
    Route::get('/personal-quizzes/{personalQuizID}/classes', [ClassPersonalQuizController::class, 'getClassesForQuiz']);
    Route::post('/personal-quizzes/{personalQuizID}/assign-classes', [ClassPersonalQuizController::class, 'assignQuizToClasses']);

    // Quiz Results (Faculty)
    Route::get('/quiz-results', [StudentQuizResultController::class, 'index']);
    Route::get('/quiz-results/{id}', [StudentQuizResultController::class, 'show']);
    Route::put('/quiz-results/{id}', [StudentQuizResultController::class, 'update']);
    Route::delete('/quiz-results/{id}', [StudentQuizResultController::class, 'destroy']);

    // Quiz History & Analytics (Faculty)
    Route::get('/classes/{classID}/quiz-results', [StudentQuizResultController::class, 'classResults']);
    Route::get('/quizzes/{classPersonalQuizID}/results', [StudentQuizResultController::class, 'quizResults']);
    Route::get('/quizzes/{classPersonalQuizID}/non-takers', [StudentQuizResultController::class, 'quizNonTakers']);

    // Quiz Sessions (Faculty)
    Route::get('/quiz-sessions/faculty-sessions', [QuizSessionController::class, 'facultySessions']);

    // ── Analytics Routes — Faculty, Program Chair, Dean (roleID: 2,3,4,5) ───
    Route::get(
        '/analytics/content/lessons/{courseId}',
        [AnalyticsController::class, 'getMostViewedLessons']
    );
    Route::get(
        '/analytics/content/questions/{examId}',
        [AnalyticsController::class, 'getQuestionStats']
    );
    Route::get(
        '/analytics/content/skipped/{courseId}',
        [AnalyticsController::class, 'getMostSkippedTopics']
    );
    Route::get(
        '/analytics/difficulty/{topicId}',
        [AnalyticsController::class, 'getDifficultyAnalytics']
    );
    Route::get(
        '/analytics/faculty/summary/{classId}',
        [AnalyticsController::class, 'getFacultySummary']
    );

});

/*
|--------------------------------------------------------------------------
| Routes for Students (roleID: 1)
|--------------------------------------------------------------------------
*/
Route::middleware(['api', 'auth:sanctum', 'role:1'])->group(function () {
    // AI Chat Assistant
    Route::post('/ai/chat', [AIController::class, 'chat'])->middleware('throttle:10,1');
    Route::get('/ai/status', [AIController::class, 'status']);


    // Get subjects specific to student's program
    Route::get('/student/practice-subjects', [SubjectController::class, 'getProgramSubjects']);

    // Practice Exam - take, submit, and view history
    Route::get('/practice-exam/generate/{subjectID}', [PracticeExamController::class, 'generate']);
    Route::post('/practice-exam/submit', [PracticeExamController::class, 'submit']);
    Route::get('/practice-exam/history', [PracticeExamController::class, 'history']);
    Route::get('/practice-exam/result/{resultID}', [PracticeExamController::class, 'getResultDetail']);

    // Enroll under a teacher
    Route::post('/enroll-teacher', [StudentTeacherEnrollmentController::class, 'enroll']);
    Route::get('/my-teachers', [StudentTeacherEnrollmentController::class, 'myTeachers']);

    // Class Enrollment (Student)
    // NEW: wired up routes so students can join classes by code, view their classes, and unenroll.
    Route::post('/classes/join', [ClassEnrollmentController::class, 'joinByCode']);
    Route::post('/classes/join-by-code', [ClassEnrollmentController::class, 'joinByCode']);
    Route::get('/my-classes', [ClassEnrollmentController::class, 'myClasses']);
    Route::get('/classes/my-classes', [ClassEnrollmentController::class, 'myClasses']);
    Route::delete('/classes/{classID}/unenroll', [ClassEnrollmentController::class, 'unenroll']);

    // Generate personal exam for a subject and teacher
    Route::post('/personal-exam/generate/{subjectID}/{teacherID}', [PracticeExamController::class, 'generatePersonalExam']);
    Route::post('/personal-exam/submit', [PracticeExamController::class, 'submitPersonalExam']);

    // Student dashboard — subjects grouped by base name with exam settings
    Route::get('/student/dashboard-subjects', [SubjectController::class, 'getDashboardSubjects']);


    // Exam preview — student views exam metadata before starting
    Route::get('/subjects/{id}/exam-preview', [SubjectController::class, 'getExamPreview']);

    // Class Quizzes (Students)
    Route::get('/classes/{classID}/quizzes/student', [ClassPersonalQuizController::class, 'studentQuizzes']);

    // Take Quiz
    Route::get('/quizzes/{classPersonalQuizID}/info', [StudentQuizController::class, 'getQuizInfo']);
    Route::post('/quizzes/{classPersonalQuizID}/start', [StudentQuizController::class, 'startQuiz']);
    Route::post('/quizzes/{classPersonalQuizID}/submit', [StudentQuizController::class, 'submitQuiz']);

    // Quiz Results (Students - own results only)
    Route::get('/quiz-results', [StudentQuizResultController::class, 'index']);
    Route::get('/quiz-results/{id}', [StudentQuizResultController::class, 'show']);

    // Quiz History (Students)
    Route::get('/classes/{classID}/quiz-history', [StudentQuizResultController::class, 'classHistory']);
    Route::get('/quizzes/{classPersonalQuizID}/history', [StudentQuizResultController::class, 'quizHistory']);

    // Quiz Sessions (Students)
    Route::get('/quiz-sessions', [QuizSessionController::class, 'studentSessions']);

    // ── Analytics Routes — Students (roleID: 1) ───────────────────────────
    Route::post(
        '/analytics/score/{attemptId}',
        [AnalyticsController::class, 'computeScore']
    );
    Route::get(
        '/analytics/weak-topics/{userId}',
        [AnalyticsController::class, 'getWeakTopics']
    );
    Route::get(
        '/analytics/recommendations/{attemptId}',
        [AnalyticsController::class, 'getRecommendations']
    );
    Route::get(
        '/analytics/rank/{examId}/{userId}',
        [AnalyticsController::class, 'getRank']
    );
    Route::get(
        '/analytics/progress/{userId}/{subjectId}',
        [AnalyticsController::class, 'getProgress']
    );
    Route::post(
        '/analytics/lesson-view',
        [AnalyticsController::class, 'logLessonView']
    );
    Route::post(
        '/analytics/question-stats',
        [AnalyticsController::class, 'updateQuestionStats']
    );
    Route::get(
        '/analytics/subject-score/{userId}/{subjectId}',
        [AnalyticsController::class, 'getSubjectScore']
    );
    Route::get(
        '/analytics/student-summary/{userId}/{attemptId}',
        [AnalyticsController::class, 'getStudentSummary']
    );

});

/*
|--------------------------------------------------------------------------
| Routes for Program Chair (roleID: 3)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:3'])->group(function () {
    Route::get('/program/{subjectID}', [QuestionController::class, 'indexQuestionsByProgram']);
});

/*
|--------------------------------------------------------------------------
| Routes for Program Chair and Dean (roleID: 3, 4, 5)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:3,4,5'])->group(function () {
    Route::patch('/questions/{questionID}/status', [QuestionController::class, 'updateStatus']);
    Route::get('/practice-settings/{subjectID}', [PracticeExamSettingController::class, 'show']);
    Route::post('/practice-settings', [PracticeExamSettingController::class, 'store']);
    Route::post('/generate-multi-subject-exam', [PrintController::class, 'generateMultiSubjectExam']);
    Route::patch('/users/{userID}/role', [UserController::class, 'changeUserRole']);
});

/*
|--------------------------------------------------------------------------
| Routes for Dean and Associate Dean (roleID: 4, 5 only)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:4,5'])->group(function () {
    Route::post('/add-subjects', [SubjectController::class, 'store']);
    Route::delete('/subjects/{subjectID}/delete', [SubjectController::class, 'destroy']);
    Route::put('/subjects/{subjectID}/update', [SubjectController::class, 'update']);
    Route::delete('/users/{userID}', [UserController::class, 'deleteUser']);
    Route::post('/users/delete-multiple', [UserController::class, 'deleteMultipleUsers']);
    Route::patch('/subjects/{subjectID}/enable-exam-questions', [SubjectController::class, 'enableExamQuestions']);
    Route::patch('/subjects/{subjectID}/disable-exam-questions', [SubjectController::class, 'disableExamQuestions']);

    // Admin Customer Support
    Route::get('/support-tickets', [\Modules\Support\Controllers\SupportTicketController::class, 'index']);
});

// Serve question_images and choices with CORS headers for frontend PDF rendering
Route::get('storage/question_images/{filename}', function ($filename) {
    $path = public_path('storage/question_images/' . $filename);
    if (!file_exists($path)) {
        abort(404);
    }
    return response()->file($path);
})->middleware('image.cors');

/*
|--------------------------------------------------------------------------
| Leaderboard Authenticated Routes
| CLEANUP: removed duplicate GET /leaderboard route. The public leaderboard
| route already exists at line ~65. Only the authenticated /leaderboard/me
| endpoint belongs here.
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/leaderboard/me', [LeaderboardController::class, 'me'])->name('leaderboard.me');
});

Route::get('storage/choices/{filename}', function ($filename) {
    $path = public_path('storage/choices/' . $filename);
    if (!file_exists($path)) {
        abort(404);
    }
    return response()->file($path);
})->middleware('image.cors');
 
