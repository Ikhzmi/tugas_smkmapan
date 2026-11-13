<?php

namespace App\Http\Controllers\Api\V1;

use App\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Schedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AttendanceController extends Controller
{
    public function teacherIndex(Request $request): JsonResponse
    {
        $teacher = $request->user()->teacher;

        if (! $teacher) {
            return ApiResponse::error('Profil guru belum tersedia.', [], 403, 'GURU_PROFILE_NOT_FOUND');
        }

        $query = Attendance::query()->with(['student', 'schoolClass', 'schedule'])->whereHas('schedule', fn ($schedule) => $schedule->where('teacher_id', $teacher->getKey()))->latest('tanggal');

        if ($request->filled('tanggal')) {
            $query->where('tanggal', $request->date('tanggal')->toDateString());
        }

        return ApiResponse::paginated($query->paginate(min(max($request->integer('per_page', 50), 1), 100)));
    }

    public function teacherStore(Request $request): JsonResponse
    {
        $teacher = $request->user()->teacher;

        if (! $teacher) {
            return ApiResponse::error('Profil guru belum tersedia.', [], 403, 'GURU_PROFILE_NOT_FOUND');
        }

        $data = $request->validate($this->rules(true));
        $schedule = Schedule::query()->with('schoolClass')->whereKey($data['schedule_id'])->where('teacher_id', $teacher->getKey())->firstOrFail();
        $student = $schedule->schoolClass->students()->whereKey($data['student_id'])->firstOrFail();

        if (Attendance::query()->where('student_id', $student->getKey())->where('schedule_id', $schedule->getKey())->where('tanggal', $data['tanggal'])->exists()) {
            return ApiResponse::error('Presensi untuk jadwal dan tanggal tersebut sudah ada.', [], 409, 'ATTENDANCE_DUPLICATE');
        }

        $attendance = Attendance::query()->create([...$data, 'class_id' => $student->class_id, 'metode' => 'guru']);

        return ApiResponse::created($attendance->load(['student', 'schoolClass', 'schedule']), 'Presensi berhasil disimpan.');
    }

    public function studentIndex(Request $request): JsonResponse
    {
        $student = $request->user()->student;

        if (! $student) {
            return ApiResponse::error('Profil siswa belum tersedia.', [], 403, 'SISWA_PROFILE_NOT_FOUND');
        }

        return ApiResponse::paginated($student->attendance()->with(['schedule', 'schoolClass'])->latest('tanggal')->paginate(min(max($request->integer('per_page', 50), 1), 100)));
    }

    public function studentStore(Request $request): JsonResponse
    {
        $student = $request->user()->student;

        if (! $student) {
            return ApiResponse::error('Profil siswa belum tersedia.', [], 403, 'SISWA_PROFILE_NOT_FOUND');
        }

        $data = $request->validate($this->rules());
        $schedule = Schedule::query()->whereKey($data['schedule_id'])->where('class_id', $student->class_id)->firstOrFail();
        $today = Carbon::today()->toDateString();

        if ($data['tanggal'] !== $today) {
            return ApiResponse::error('Presensi mandiri hanya dapat diisi untuk hari ini.', ['tanggal' => ['Tanggal harus hari ini.']], 422, 'ATTENDANCE_DATE_NOT_ALLOWED');
        }

        if (Attendance::query()->where('student_id', $student->getKey())->where('schedule_id', $schedule->getKey())->where('tanggal', $today)->exists()) {
            return ApiResponse::error('Presensi untuk jadwal dan tanggal tersebut sudah ada.', [], 409, 'ATTENDANCE_DUPLICATE');
        }

        $attendance = Attendance::query()->create([...$data, 'student_id' => $student->getKey(), 'class_id' => $student->class_id, 'metode' => 'mandiri']);

        return ApiResponse::created($attendance, 'Presensi berhasil disimpan.');
    }

    public function update(Request $request, Attendance $attendance): JsonResponse
    {
        $user = $request->user();
        $isAdmin = $user->role === 'admin';
        $isOwner = $user->role === 'guru' && $user->teacher && $attendance->schedule?->teacher_id === $user->teacher->getKey();

        if (! $isAdmin && ! $isOwner) {
            abort(404);
        }

        $data = $request->validate([
            'jam_masuk' => ['sometimes', 'nullable', 'date_format:H:i'],
            'status' => ['sometimes', 'in:hadir,terlambat,izin,sakit,alpa'],
            'catatan' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);
        $attendance->update($data);

        return ApiResponse::success($attendance->fresh(), 'Presensi berhasil diperbarui.');
    }

    public function summary(Request $request): JsonResponse
    {
        $data = $request->validate([
            'class_id' => ['nullable', 'uuid', 'exists:classes,id'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        ]);
        $query = Attendance::query()->with('schoolClass');

        if (! empty($data['class_id'])) {
            $query->where('class_id', $data['class_id']);
        }
        if (! empty($data['date_from'])) {
            $query->whereDate('tanggal', '>=', $data['date_from']);
        }
        if (! empty($data['date_to'])) {
            $query->whereDate('tanggal', '<=', $data['date_to']);
        }

        $records = $query->get();

        return ApiResponse::success([
            'total' => $records->count(),
            'by_status' => $records->groupBy('status')->map->count(),
            'by_class' => $records->groupBy(fn (Attendance $attendance): string => (string) $attendance->class_id)->map(fn ($rows): array => [
                'class_id' => $rows->first()->class_id,
                'class_name' => $rows->first()->schoolClass?->nama,
                'total' => $rows->count(),
                'by_status' => $rows->groupBy('status')->map->count(),
            ])->values(),
        ]);
    }

    /** @return array<string, list<string>> */
    private function rules(bool $studentRequired = false): array
    {
        return [
            'student_id' => [$studentRequired ? 'required' : 'sometimes', 'uuid', 'exists:students,id'],
            'schedule_id' => ['required', 'uuid', 'exists:schedules,id'],
            'tanggal' => ['required', 'date_format:Y-m-d'],
            'jam_masuk' => ['nullable', 'date_format:H:i'],
            'status' => ['required', 'in:hadir,terlambat,izin,sakit,alpa'],
            'catatan' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
