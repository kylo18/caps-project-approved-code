<?php

use Illuminate\Support\Facades\Route;
use Modules\Users\Controllers\AuthController;
use Modules\Subjects\Controllers\SubjectController;
use Modules\FacultySubjects\Controllers\FacultySubjectController;
use Modules\Questions\Controllers\QuestionController;
use Modules\Choices\Controllers\ChoiceController;
use Modules\Users\Controllers\UserController;
use App\Http\Middleware\TokenExpirationMiddleware;

//User authentication routes
Route::post('/register', action: [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', TokenExpirationMiddleware::class,])->group(function () {
    //Password change route
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    //Logout route
    Route::post('/logout', [AuthController::class, 'logout']);
});

Route::middleware(['auth:sanctum', TokenExpirationMiddleware::class, 'role:2,3,4'])->group(function () {
    //CHOICES FUNCTIONALITIES ROUTE
    Route::post('/questions/choices', [ChoiceController::class, 'store']);
    Route::get('/questions/{questionID}/choices', [ChoiceController::class, 'showChoices']);
    //subject functionalities route
    Route::get('/subjects', [SubjectController::class, 'index']);
    Route::post('/faculty/assign-subject', action: [FacultySubjectController::class, 'assignSubject']);
    Route::get('/faculty/my-subjects', [FacultySubjectController::class, 'mySubjects']);
    Route::delete('/remove-assigned-subject/{subjectID}', [FacultySubjectController::class, 'removeAssignedSubject']);

    //question functionalities route
    Route::post('/questions/add', [QuestionController::class, 'store']);
    Route::get('/subjects/{subjectID}/questions', [QuestionController::class, 'indexQuestions']);
    Route::put('/questions/update/{questionID}', [QuestionController::class, 'update']);
    Route::delete('/questions/delete/{questionID}', [QuestionController::class, 'destroy']);
    Route::get('/faculty/my-questions/{subjectID}', [QuestionController::class, 'mySubjectQuestions']);
});

Route::middleware(['auth:sanctum','role:3'])->group(function () {
    Route::get('/program/{subjectID}', [QuestionController::class, 'indexQuestionsByProgram']);
});

Route::middleware(['auth:sanctum','role:3,4'])->group(function () {
    //update question status route
    Route::patch('/questions/{questionID}/status', [QuestionController::class, 'updateStatus']);
});

Route::middleware(['auth:sanctum','role:4'])->group(function () {
    // users route
    Route::get('/users', [UserController::class, 'index']);
    Route::patch('/users/{userID}/approve', [UserController::class, 'approveUser']);
    Route::patch('/users/{userID}/disapprove', [UserController::class, 'disapproveUser']);
    Route::post('/users/approve-multiple', [UserController::class, 'approveMultipleUsers']);
    Route::post('/users/activate-multiple', [UserController::class, 'activateMultipleUsers']);
    Route::post('/users/deactivate-multiple', [UserController::class, 'deactivateMultipleUsers']);
    Route::patch('users/{id}/deactivate', [UserController::class, 'deactivate']);
    Route::patch('users/{id}/activate', [UserController::class, 'activate']);

    //subjects route
    Route::post('/add-subjects', [SubjectController::class, 'store']);
    Route::delete('/subjects/{subjectID}/delete', [SubjectController::class, 'destroy']);
    Route::put('/subjects/{subjectID}/update', [SubjectController::class, 'update']);
});
