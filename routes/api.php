<?php

use App\Http\Controllers\Api\V1\Admin\AccountController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/ping', fn () => response()->json([
        'status' => 'ok',
        'app' => 'SMKM 8 Medan API',
    ]));

    Route::prefix('auth')->group(function (): void {
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

        Route::middleware(['auth:sanctum', 'throttle:auth-actions'])->group(function (): void {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
            Route::patch('/profile', [AuthController::class, 'updateProfile']);
            Route::post('/change-password', [AuthController::class, 'changePassword']);
            Route::post('/session/claim', [AuthController::class, 'claimSession']);
            Route::post('/session/resume', [AuthController::class, 'resumeSession']);
            Route::post('/session/heartbeat', [AuthController::class, 'heartbeat']);
            Route::post('/session/release', [AuthController::class, 'releaseSession']);
            Route::get('/session/status', [AuthController::class, 'sessionStatus']);
        });
    });

    Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function (): void {
        Route::get('/accounts', [AccountController::class, 'index']);
        Route::post('/accounts', [AccountController::class, 'store']);
        Route::patch('/accounts/{user}/role', [AccountController::class, 'updateRole']);
        Route::post('/accounts/{user}/reset-password', [AccountController::class, 'resetPassword']);
        Route::delete('/accounts/{user}', [AccountController::class, 'destroy']);
    });
});
