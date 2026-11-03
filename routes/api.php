<?php

use App\Http\Controllers\Api\V1\Admin\AcademicController;
use App\Http\Controllers\Api\V1\Admin\AccountController;
use App\Http\Controllers\Api\V1\Admin\StudentController;
use App\Http\Controllers\Api\V1\Admin\TeacherController;
use App\Http\Controllers\Api\V1\AttendanceController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\ExamController;
use App\Http\Controllers\Api\V1\LmsController;
use App\Http\Controllers\Api\V1\PublicController;
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

    Route::prefix('public')->group(function (): void {
        Route::get('/site', [PublicController::class, 'site']);
        Route::get('/majors', [PublicController::class, 'majors']);
        Route::get('/teachers', [PublicController::class, 'teachers']);
        Route::get('/facilities', [PublicController::class, 'facilities']);
        Route::get('/eskul', [PublicController::class, 'eskul']);
        Route::get('/gallery', [PublicController::class, 'gallery']);
        Route::get('/videos', [PublicController::class, 'videos']);
        Route::post('/ppdb', [PublicController::class, 'storePpdb'])->middleware('throttle:public-forms');
        Route::post('/suggestions', [PublicController::class, 'storeSuggestion'])->middleware('throttle:public-forms');
        Route::post('/visits', [PublicController::class, 'storeVisit'])->middleware('throttle:public-forms');
    });

    Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function (): void {
        Route::get('/accounts', [AccountController::class, 'index']);
        Route::post('/accounts', [AccountController::class, 'store']);
        Route::patch('/accounts/{user}/role', [AccountController::class, 'updateRole']);
        Route::post('/accounts/{user}/reset-password', [AccountController::class, 'resetPassword']);
        Route::delete('/accounts/{user}', [AccountController::class, 'destroy']);
        Route::get('/teachers', [TeacherController::class, 'index']);
        Route::post('/teachers', [TeacherController::class, 'store']);
        Route::patch('/teachers/{teacher}', [TeacherController::class, 'update']);
        Route::delete('/teachers/{teacher}', [TeacherController::class, 'destroy']);
        Route::get('/students', [StudentController::class, 'index']);
        Route::post('/students', [StudentController::class, 'store']);
        Route::patch('/students/{student}', [StudentController::class, 'update']);
        Route::delete('/students/{student}', [StudentController::class, 'destroy']);
        Route::get('/classes', [AcademicController::class, 'classes']);
        Route::post('/classes', [AcademicController::class, 'storeClass']);
        Route::patch('/classes/{schoolClass}', [AcademicController::class, 'updateClass']);
        Route::delete('/classes/{schoolClass}', [AcademicController::class, 'destroyClass']);
        Route::get('/subjects', [AcademicController::class, 'subjects']);
        Route::post('/subjects', [AcademicController::class, 'storeSubject']);
        Route::patch('/subjects/{subject}', [AcademicController::class, 'updateSubject']);
        Route::delete('/subjects/{subject}', [AcademicController::class, 'destroySubject']);
        Route::get('/schedules', [AcademicController::class, 'schedules']);
        Route::post('/schedules', [AcademicController::class, 'storeSchedule']);
        Route::patch('/schedules/{schedule}', [AcademicController::class, 'updateSchedule']);
        Route::delete('/schedules/{schedule}', [AcademicController::class, 'destroySchedule']);
    });

    Route::middleware(['auth:sanctum', 'role:guru'])->prefix('guru')->group(function (): void {
        Route::get('/materials', [LmsController::class, 'teacherMaterials']);
        Route::post('/materials', [LmsController::class, 'storeMaterial']);
        Route::patch('/materials/{material}', [LmsController::class, 'updateMaterial']);
        Route::delete('/materials/{material}', [LmsController::class, 'destroyMaterial']);
        Route::post('/materials/{material}/publish', [LmsController::class, 'publishMaterial']);
        Route::get('/assignments', [LmsController::class, 'teacherAssignments']);
        Route::post('/assignments', [LmsController::class, 'storeAssignment']);
        Route::patch('/assignments/{assignment}', [LmsController::class, 'updateAssignment']);
        Route::delete('/assignments/{assignment}', [LmsController::class, 'destroyAssignment']);
        Route::post('/assignments/{assignment}/publish', [LmsController::class, 'publishAssignment']);
        Route::get('/assignments/{assignment}/submissions', [LmsController::class, 'assignmentSubmissions']);
        Route::patch('/submissions/{submission}/grade', [LmsController::class, 'gradeSubmission']);
        Route::get('/submissions/{submission}/download', [LmsController::class, 'downloadSubmission']);
        Route::get('/exams', [ExamController::class, 'teacherExams']);
        Route::post('/exams', [ExamController::class, 'storeExam']);
        Route::patch('/exams/{exam}', [ExamController::class, 'updateExam']);
        Route::delete('/exams/{exam}', [ExamController::class, 'destroyExam']);
        Route::post('/exams/{exam}/questions', [ExamController::class, 'storeQuestion']);
        Route::patch('/questions/{question}', [ExamController::class, 'updateQuestion']);
        Route::delete('/questions/{question}', [ExamController::class, 'destroyQuestion']);
        Route::post('/exams/{exam}/code', [ExamController::class, 'generateCode'])->middleware('throttle:exam-code');
        Route::get('/exams/{exam}/attempts', [ExamController::class, 'teacherAttempts']);
        Route::post('/attempts/{attempt}/reset', [ExamController::class, 'resetAttempt']);
        Route::get('/exams/events', [ExamController::class, 'events']);
    });

    Route::middleware(['auth:sanctum', 'role:siswa'])->prefix('siswa')->group(function (): void {
        Route::get('/materials', [LmsController::class, 'studentMaterials']);
        Route::get('/assignments', [LmsController::class, 'studentAssignments']);
        Route::post('/assignments/{assignment}/submissions', [LmsController::class, 'submitAssignment']);
        Route::get('/submissions', [LmsController::class, 'studentSubmissions']);
        Route::get('/attendance', [AttendanceController::class, 'studentIndex']);
        Route::post('/attendance', [AttendanceController::class, 'studentStore']);
        Route::get('/exams', [ExamController::class, 'studentExams']);
        Route::get('/exams/{exam}/unlock', [ExamController::class, 'hasUnlock']);
        Route::post('/exams/{exam}/unlock', [ExamController::class, 'unlock'])->middleware('throttle:exam-code');
        Route::post('/exams/{exam}/attempts', [ExamController::class, 'start']);
        Route::get('/attempts/{attempt}', [ExamController::class, 'attempt']);
        Route::put('/attempts/{attempt}/answers/{question}', [ExamController::class, 'answer']);
        Route::post('/attempts/{attempt}/warnings', [ExamController::class, 'warning']);
        Route::post('/attempts/{attempt}/submit', [ExamController::class, 'submit']);
        Route::post('/attempts/{attempt}/terminate', [ExamController::class, 'terminate']);
    });

    Route::middleware(['auth:sanctum', 'role:guru'])->prefix('guru')->group(function (): void {
        Route::get('/attendance', [AttendanceController::class, 'teacherIndex']);
        Route::post('/attendance', [AttendanceController::class, 'teacherStore']);
    });
});
