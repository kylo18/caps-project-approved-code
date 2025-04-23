<?php

use Illuminate\Support\Facades\Route;
use Modules\Users\Controllers\AuthController;

Route::get('/register', [AuthController::class, 'showRegisterForm'])->name('register.form');
Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login.form');
