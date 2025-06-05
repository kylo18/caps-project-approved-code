<?php

use Illuminate\Support\Facades\Route;
use Modules\Users\Controllers\AuthController;
use Modules\Subjects\Controllers\SubjectController;
use Modules\FacultySubjects\Controllers\FacultySubjectController;
use Modules\Questions\Controllers\QuestionController;
use Modules\Choices\Controllers\ChoiceController;
use Modules\Users\Controllers\UserController;
use App\Http\Middleware\TokenExpirationMiddleware;
use Modules\PracticeExams\Controllers\PracticeExamSettingController;
use Modules\PracticeExams\Controllers\PracticeExamController;
use Modules\Users\Controllers\ProgramController;
use Modules\Users\Controllers\RoleController;
use Modules\Users\Controllers\PasswordResetController;
use Modules\App\Controllers\AppController;
use Modules\Print\Controllers\PrintController;
use Modules\Subjects\Controllers\YearLevelController;

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
});

/*
|--------------------------------------------------------------------------
| Routes for Faculty (roleID: 2), Program Chair (roleID: 3), and Dean (roleID: 4)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', TokenExpirationMiddleware::class, 'role:2,3,4'])->group(function () {
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

    // Printable exam (PDF preview/download)
    Route::post('/generate-printable-exam/{subjectID}', [PrintController::class, 'generatePrintableExam']);

    // Practice exam preview (Dean/Chair/Instructor can preview)
    Route::get('/api/exam/preview/{subjectID}', [PracticeExamController::class, 'generate']);
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
| Routes for Program Chair and Dean (roleID: 3, 4)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:3,4'])->group(function () {
    // Question approval (approve/disapprove)
    Route::patch('/questions/{questionID}/status', [QuestionController::class, 'updateStatus']);

    // Practice Exam Settings
    Route::get('/practice-settings/{subjectID}', [PracticeExamSettingController::class, 'show']);
    Route::post('/practice-settings', [PracticeExamSettingController::class, 'store']);

    // Programs listing
    Route::get('/programs', [ProgramController::class, 'index']);

    // Multi-subject exam generation
    Route::post('/generate-multi-subject-exam', [PrintController::class, 'generateMultiSubjectExam']);
});

/*
|--------------------------------------------------------------------------
| Routes for Dean (roleID: 4 only)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:4'])->group(function () {
    // User management
    Route::get('/users', [UserController::class, 'index']);
    Route::patch('/users/{userID}/approve', [UserController::class, 'approveUser']);
    Route::patch('/users/{userID}/disapprove', [UserController::class, 'disapproveUser']);
    Route::post('/users/approve-multiple', [UserController::class, 'approveMultipleUsers']);
    Route::post('/users/activate-multiple', [UserController::class, 'activateMultipleUsers']);
    Route::post('/users/deactivate-multiple', [UserController::class, 'deactivateMultipleUsers']);
    Route::patch('users/{id}/deactivate', [UserController::class, 'deactivate']);
    Route::patch('users/{id}/activate', [UserController::class, 'activate']);

    // Subject management
    Route::post('/add-subjects', [SubjectController::class, 'store']);
    Route::delete('/subjects/{subjectID}/delete', [SubjectController::class, 'destroy']);
    Route::put('/subjects/{subjectID}/update', [SubjectController::class, 'update']);
});
