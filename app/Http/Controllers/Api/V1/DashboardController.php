<?php

namespace App\Http\Controllers\Api\V1;

use App\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Exam;
use App\Models\Material;
use App\Models\Schedule;
use App\Models\Submission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function teacher(Request $request): JsonResponse
    {
        $teacher = $request->user()->teacher;
        if (! $teacher) {
            return ApiResponse::error('Profil guru belum tersedia.', [], 403, 'GURU_PROFILE_NOT_FOUND');
        }

        return ApiResponse::success([
            'teacher' => $teacher,
            'stats' => [
                'materials' => Material::query()->where('teacher_id', $teacher->getKey())->count(),
                'assignments' => Assignment::query()->where('teacher_id', $teacher->getKey())->count(),
                'exams' => Exam::query()->where('teacher_id', $teacher->getKey())->count(),
                'pending_submissions' => Submission::query()->whereNull('nilai')->whereHas('assignment', fn ($query) => $query->where('teacher_id', $teacher->getKey()))->count(),
            ],
            'today_schedules' => Schedule::query()->with(['schoolClass', 'subject'])->where('teacher_id', $teacher->getKey())->where('hari', $this->today())->orderBy('jam_mulai')->get(),
        ]);
    }

    public function student(Request $request): JsonResponse
    {
        $student = $request->user()->student;
        if (! $student) {
            return ApiResponse::error('Profil siswa belum tersedia.', [], 403, 'SISWA_PROFILE_NOT_FOUND');
        }

        return ApiResponse::success([
            'student' => $student->load('schoolClass.major'),
            'stats' => [
                'materials' => Material::query()->where('class_id', $student->class_id)->where('is_published', true)->count(),
                'assignments_open' => Assignment::query()->where('class_id', $student->class_id)->where('is_published', true)->count(),
                'exams_available' => Exam::query()->where('is_active', true)->count(),
            ],
            'today_schedules' => Schedule::query()->with(['teacher', 'subject'])->where('class_id', $student->class_id)->where('hari', $this->today())->orderBy('jam_mulai')->get(),
        ]);
    }

    public function teacherSchedules(Request $request): JsonResponse
    {
        $teacher = $request->user()->teacher;
        if (! $teacher) {
            return ApiResponse::error('Profil guru belum tersedia.', [], 403, 'GURU_PROFILE_NOT_FOUND');
        }

        return ApiResponse::paginated(Schedule::query()->with(['schoolClass', 'subject'])->where('teacher_id', $teacher->getKey())->orderBy('hari')->orderBy('jam_mulai')->paginate(min(max($request->integer('per_page', 50), 1), 100)));
    }

    public function studentSchedules(Request $request): JsonResponse
    {
        $student = $request->user()->student;
        if (! $student) {
            return ApiResponse::error('Profil siswa belum tersedia.', [], 403, 'SISWA_PROFILE_NOT_FOUND');
        }

        return ApiResponse::paginated(Schedule::query()->with(['teacher', 'subject'])->where('class_id', $student->class_id)->orderBy('hari')->orderBy('jam_mulai')->paginate(min(max($request->integer('per_page', 50), 1), 100)));
    }

    private function today(): string
    {
        return ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'][now()->dayOfWeek];
    }
}
