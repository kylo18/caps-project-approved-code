<?php

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
use Modules\Users\Controllers\StudentTeacherEnrollmentController;
use Modules\PersonalExams\Controllers\PersonalQuizController;
use Modules\PersonalExams\Controllers\PersonalQuizQuestionController;
use Modules\PersonalExams\Controllers\PersonalQuizChoiceController;
use Modules\PersonalExams\Controllers\PersonalQuizSettingController;
use Modules\PersonalClasses\Controllers\ClassController;
use Modules\PersonalClasses\Controllers\ClassEnrollmentController;
use Modules\PersonalClasses\Controllers\ClassPersonalQuizController;
use Modules\PersonalExams\Controllers\StudentQuizResultController;
use Modules\PersonalExams\Controllers\StudentQuizController;
use Modules\PersonalExams\Controllers\QuizSessionController;

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
| Authenticated Routes (All roles)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {
    // User profile and authentication
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user/profile', [UserController::class, 'getProfile']);
    Route::post('/user/update-profile', [UserController::class, 'updateProfile']);

    // All subjects (no role restriction, but blocks userID 1)
    Route::get('/subjects/all', [SubjectController::class, 'allSubjects']);

    // Allow all authenticated users to access their exam results for a subject
    Route::get('/practice-exam/results/{subjectID}', [PracticeExamController::class, 'subjectExamResults']);

    // Get all exam results for all students (not filtered by subject)
    Route::get('/results/all-students', [PracticeExamController::class, 'getAllExamResults']);
    
    // Practice Exam Leaderboard & Recent Takers (All authenticated users can access)
    Route::get('/practice-exam/leaderboard/{subjectID}', [PracticeExamLeaderboardController::class, 'leaderboard']);
    Route::get('/practice-exam/recent-takers/{subjectID}', [PracticeExamLeaderboardController::class, 'recentTakers']);
    Route::get('/practice-exam/overall-leaderboard', [PracticeExamLeaderboardController::class, 'overallLeaderboard']);
    Route::get('/practice-exam/overall-recent-takers', [PracticeExamLeaderboardController::class, 'overallRecentTakers']);

    // Get all personal quizzes for a class
    Route::get('/classes/{classID}/quizzes', [ClassPersonalQuizController::class, 'index']);

    // Get all classes
    Route::get('/classes/index', [ClassController::class, 'index']);


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

    // Subjects
    Route::get('/subjects', [SubjectController::class, 'index']);
    Route::post('/faculty/assign-subject', [FacultySubjectController::class, 'assignSubject']);
    Route::get('/faculty/my-subjects', [FacultySubjectController::class, 'mySubjects']);
    Route::get('/faculty/availableSubjects', [FacultySubjectController::class, 'availableSubjects']);
    Route::delete('/remove-assigned-subject/{subjectID}', [FacultySubjectController::class, 'removeAssignedSubject']);

    // Year Levels
    Route::get('/year-levels', [YearLevelController::class, 'index']);

    // Questions
    Route::post('/questions/add', [QuestionController::class, 'store']);
    Route::get('/subjects/{subjectID}/questions', [QuestionController::class, 'indexQuestions']);
    Route::post('/questions/update/{questionID}', [QuestionController::class, 'update']);
    Route::delete('/questions/delete/{questionID}', [QuestionController::class, 'destroy']);
    Route::get('/faculty/my-questions/{subjectID}', [QuestionController::class, 'mySubjectQuestions']);
    Route::post('/choices/update', [ChoiceController::class, 'updateChoices']);
    Route::post('/questions/{questionID}/duplicate', [QuestionController::class, 'duplicate']);
    // New route: Get all questions without choices
    Route::get('/questions/count', [QuestionController::class, 'questionCount']);

    // Printable exam (PDF preview/download)
    Route::post('/generate-printable-exam/{subjectID}', [PrintController::class, 'generatePrintableExam']);
    Route::post('/generate-personal-quiz-pdf', [PrintController::class, 'generatePersonalQuizPDF']);

    // Practice exam preview (Dean/Chair/Instructor can preview)
    Route::get('/practice-exam/preview/{subjectID\}', [PracticeExamController::class, 'previewPracticeExam']);

    // Single-subject personal questions preview (Quiz)
    Route::post('/generate-single-subject-personal-preview', [PrintController::class, 'generateSingleSubjectPersonalPreview']);

    //programs listing
    Route::get('/programs', [ProgramController::class, 'index']);

    // Personal Quizzes (Libraries)
    Route::post('/personal-quizzes', [PersonalQuizController::class, 'store']);
    Route::get('/personal-quizzes', [PersonalQuizController::class, 'index']);
    Route::get('/personal-quizzes/archived', [PersonalQuizController::class, 'archived']);
    Route::put('/update-personal-quizzes/{personalQuizID}', [PersonalQuizController::class, 'update']);
    Route::patch('/personal-quizzes/{personalQuizID}/archive', [PersonalQuizController::class, 'archive']);
    Route::patch('/personal-quizzes/{personalQuizID}/unarchive', [PersonalQuizController::class, 'unarchive']);
    Route::delete('/personal-quizzes/{personalQuizID}', [PersonalQuizController::class, 'destroy']);
    // Personal Quiz Questions
    Route::get('/personal-quiz-questions/{personalQuizID}', [PersonalQuizQuestionController::class, 'index']);
    Route::post('/personal-quiz-questions', [PersonalQuizQuestionController::class, 'store']);
    Route::post('/personal-quiz-questions/import', [PersonalQuizQuestionController::class, 'import']); // Handles multiple questions at once
    Route::post('/personal-quiz-questions/{personalQuizQuestionID}', [PersonalQuizQuestionController::class, 'update']);
    Route::post('/personal-quiz-questions/{personalQuizQuestionID}/duplicate', [PersonalQuizQuestionController::class, 'duplicate']);
    Route::delete('/personal-quiz-questions/{personalQuizQuestionID}', [PersonalQuizQuestionController::class, 'destroy']);

    // Personal Quiz Choices
    Route::get('/personal-quiz-choices/{personalQuizQuestionID}', [PersonalQuizChoiceController::class, 'show']);
    Route::post('/personal-quiz-choices', [PersonalQuizChoiceController::class, 'store']);
    Route::put('/personal-quiz-choices', [PersonalQuizChoiceController::class, 'updateChoices']);
    Route::post('/personal-quiz-choices/update', [PersonalQuizChoiceController::class, 'updateChoices']); // Alias for frontend compatibility
    Route::delete('/personal-quiz-choices/{personalQuizChoiceID}', [PersonalQuizChoiceController::class, 'destroy']);

    // Personal Quiz Settings (CRUD)
    Route::get('/personal-quizzes/{personalQuizID}/settings', [PersonalQuizSettingController::class, 'show']);
    Route::post('/personal-quizzes/{personalQuizID}/settings', [PersonalQuizSettingController::class, 'store']);
    Route::put('/personal-quizzes/{personalQuizID}/settings', [PersonalQuizSettingController::class, 'update']);
    Route::delete('/personal-quizzes/{personalQuizID}/settings', [PersonalQuizSettingController::class, 'destroy']);

    // Personal Exam Settings (store, show) - reusing PracticeExamSettingController
    Route::post('/personal-exam-settings', [PracticeExamSettingController::class, 'store']);
    Route::get('/personal-exam-settings/{subjectID}', [PracticeExamSettingController::class, 'show']);

    // Get all students enrolled under the authenticated teacher
    Route::get('/my-students', [StudentTeacherEnrollmentController::class, 'myStudents']);

    // Get exam questions status
    Route::get('/subjects/{subjectID}/exam-questions-status', [SubjectController::class, 'getExamQuestionsStatus']);

    // Get leaderboard for a subject (enhanced version)
    Route::get('/practice-exam/leaderboard/{subjectID}', [PracticeExamLeaderboardController::class, 'leaderboard']);
    Route::get('/practice-exam/recent-takers/{subjectID}', [PracticeExamLeaderboardController::class, 'recentTakers']);
    Route::get('/practice-exam/overall-leaderboard', [PracticeExamLeaderboardController::class, 'overallLeaderboard']);

    // Personal Classes (Faculty)
    Route::post('/classes', [ClassController::class, 'store']);
    Route::get('/classes/archived', [ClassController::class, 'archived']);
    Route::get('/classes/show/{classID}', [ClassController::class, 'show']);
    Route::put('/classes/update/{classID}', [ClassController::class, 'update']);
    Route::patch('/classes/archive/{classID}', [ClassController::class, 'archive']);
    Route::patch('/classes/{classID}/unarchive', [ClassController::class, 'unarchive']);
    Route::delete('/classes/destroy/{classID}', [ClassController::class, 'destroy']);

    // Class Enrollments (Faculty)
    Route::get('/classes/{classID}/students', [ClassEnrollmentController::class, 'index']);
    Route::delete('/classes/{classID}/remove-student', [ClassEnrollmentController::class, 'removeStudent']);

    // Class Personal Quizzes (Faculty)
    Route::get('/classes/{classID}/quizzes/available', [ClassPersonalQuizController::class, 'availablePersonalQuizzes']);
    Route::post('/classes/quizzes', [ClassPersonalQuizController::class, 'store']);
    Route::put('/classes/quizzes/{classPersonalQuizID}', [ClassPersonalQuizController::class, 'update']);
    Route::patch('/classes/quizzes/{classPersonalQuizID}/dates', [ClassPersonalQuizController::class, 'updateDates']);
    Route::delete('/classes/quizzes/{classPersonalQuizID}', [ClassPersonalQuizController::class, 'destroy']);
    
    // Personal Quiz to Classes Assignment (Faculty)
    Route::get('/personal-quizzes/{personalQuizID}/classes', [ClassPersonalQuizController::class, 'getClassesForQuiz']);
    Route::post('/personal-quizzes/{personalQuizID}/assign-classes', [ClassPersonalQuizController::class, 'assignQuizToClasses']);
    
    // Quiz Results (Faculty - can view results for their classes)
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
});

/*
|--------------------------------------------------------------------------
| Routes for Students (roleID: 1)
|--------------------------------------------------------------------------
*/
Route::middleware(['api', 'auth:sanctum', 'role:1'])->group(function () {
    // Get subjects specific to student's program
    Route::get('/student/practice-subjects', [SubjectController::class, 'getProgramSubjects']);

    // Practice Exam - take, submit, and view history
    Route::get('/practice-exam/generate/{subjectID}', [PracticeExamController::class, 'generate']);
    Route::post('/practice-exam/submit', [PracticeExamController::class, 'submit']);
    Route::get('/practice-exam/history', [PracticeExamController::class, 'history']);

    // Enroll under a teacher
    Route::post('/enroll-teacher', [StudentTeacherEnrollmentController::class, 'enroll']);
    // Get all teachers a student is enrolled with
    Route::get('/my-teachers', [StudentTeacherEnrollmentController::class, 'myTeachers']);

    // Generate personal exam for a subject and teacher
    Route::post('/personal-exam/generate/{subjectID}/{teacherID}', [PracticeExamController::class, 'generatePersonalExam']);
    // Submit personal exam results
    Route::post('/personal-exam/submit', [PracticeExamController::class, 'submitPersonalExam']);

    // Class Enrollments (Students)
    Route::get('/classes/my-classes', [ClassEnrollmentController::class, 'myClasses']);
    Route::post('/classes/join-by-code', [ClassEnrollmentController::class, 'joinByCode']);
    Route::get('/classes/join/{token}', [ClassEnrollmentController::class, 'joinByLink']);
    Route::delete('/classes/{classID}/unenroll', [ClassEnrollmentController::class, 'unenroll']);

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
});

/*
|--------------------------------------------------------------------------
| Routes for Program Chair (roleID: 3)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:3'])->group(function () {
    // Program-specific questions
    Route::get('/program/{subjectID}', [QuestionController::class, 'indexQuestionsByProgram']);
});

/*
|--------------------------------------------------------------------------
| Routes for Program Chair and Dean (roleID: 3, 4, 5)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:3,4,5'])->group(function () {
    // Question approval (approve/disapprove)
    Route::patch('/questions/{questionID}/status', [QuestionController::class, 'updateStatus']);

    // Practice Exam Settings
    Route::get('/practice-settings/{subjectID}', [PracticeExamSettingController::class, 'show']);
    Route::post('/practice-settings', [PracticeExamSettingController::class, 'store']);

    // Multi-subject exam generation
    Route::post('/generate-multi-subject-exam', [PrintController::class, 'generateMultiSubjectExam']);


    Route::patch('/users/{userID}/role', [UserController::class, 'changeUserRole']);
});

/*
|--------------------------------------------------------------------------
| Routes for Dean and Associate Dean (roleID: 4, 5 only)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:4,5'])->group(function () {

    // Subject management
    Route::post('/add-subjects', [SubjectController::class, 'store']);
    Route::delete('/subjects/{subjectID}/delete', [SubjectController::class, 'destroy']);
    Route::put('/subjects/{subjectID}/update', [SubjectController::class, 'update']);

    // User deletion (Dean and Associate Dean only)
    Route::delete('/users/{userID}', [UserController::class, 'deleteUser']);
    Route::post('/users/delete-multiple', [UserController::class, 'deleteMultipleUsers']);

    // Exam questions management
    Route::patch('/subjects/{subjectID}/enable-exam-questions', [SubjectController::class, 'enableExamQuestions']);
    Route::patch('/subjects/{subjectID}/disable-exam-questions', [SubjectController::class, 'disableExamQuestions']);
});

// Serve question_images and choices with CORS headers for frontend PDF rendering
Route::get('storage/question_images/{filename}', function ($filename) {
    $path = public_path('storage/question_images/' . $filename);
    if (!file_exists($path)) {
        abort(404);
    }
    return response()->file($path);
})->middleware('image.cors');

Route::get('storage/choices/{filename}', function ($filename) {
    $path = public_path('storage/choices/' . $filename);
    if (!file_exists($path)) {
        abort(404);
    }
    return response()->file($path);
})->middleware('image.cors');
