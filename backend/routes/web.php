<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::post(
    '/login',
    [
        AuthController::class,
        'login',
    ]
);

Route::post(
    '/verify-2fa',
    [
        AuthController::class,
        'verifyTwoFactor',
    ]
);

Route::post(
    '/resend-2fa',
    [
        AuthController::class,
        'resendTwoFactor',
    ]
);

Route::post(
    '/logout',
    [
        AuthController::class,
        'logout',
    ]
);
