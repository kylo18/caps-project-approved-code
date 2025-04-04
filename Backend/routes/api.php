<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Modules\Users\AuthController;
use App\Http\Controllers\Modules\Subjects\Http\Controllers\SubjectController;
use App\Http\Controllers\Modules\FacultySubjects\Http\Controllers\FacultySubjectController;
use App\Http\Controllers\Modules\Questions\Http\Controllers\QuestionController;
use app\Http\Controllers\Modules\PracticeExam\Http\Controllers\PracticeExamController;
use App\Http\Controllers\Modules\Choices\Http\Controllers\ChoiceController;
use app\Http\Controllers\Modules\Users\UserController;

//User authentication routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum'])->group(function () {
    //Password change route
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    //Logout route
    Route::post('/logout', [AuthController::class, 'logout']);
});

Route::middleware(['auth:sanctum', 'role:2,3,4'])->group(function () {
    //CHOICES FUNCTIONALITIES ROUTE
    Route::post('/questions/choices', [ChoiceController::class, 'store']);
    Route::get('/questions/{questionID}/choices', [ChoiceController::class, 'showChoices']);
    //subject functionalities route
    Route::get('/subjects', [SubjectController::class, 'index']);
    Route::post('/faculty/assign-subject', [FacultySubjectController::class, 'assignSubject']);
    Route::get('/faculty/my-subjects', [FacultySubjectController::class, 'mySubjects']);

    //question functionalities route
    Route::post('/questions/add', [QuestionController::class, 'store']);
    Route::get('/questions/search', [QuestionController::class, 'search']);
    Route::get('/subjects/{subjectID}/questions', [QuestionController::class, 'indexQuestions']);
    Route::put('/questions/update/{questionID}', [QuestionController::class, 'update']);
    Route::delete('/questions/delete/{questionID}', [QuestionController::class, 'destroy']);

    //exam functionalities route
    Route::post('/practice-exams', [PracticeExamController::class, 'store']);
});

Route::middleware(['auth:sanctum', 'role:3,4'])->group(function () {
    //update question status route
    Route::patch('/questions/{questionID}/status', [QuestionController::class, 'updateStatus']);
});

Route::middleware(['auth:sanctum', 'role:4'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::patch('/users/{userID}/approve', [UserController::class, 'approveUser']);
    Route::patch('/users/{userID}/disapprove', [UserController::class, 'disapproveUser']);

    Route::put('users/{id}/deactivate', [UserController::class, 'deactivate'])
        ->name('users.deactivate');

    Route::put('users/{id}/activate', [UserController::class, 'activate'])
        ->name('users.activate');

    //add subjects route
    Route::post('/add-subjects', [SubjectController::class, 'store']);
    Route::delete('/subjects/{subjectID}/delete', [SubjectController::class, 'destroy']);
    Route::put('/subjects/{subjectID}/update', [SubjectController::class, 'update']);
});
