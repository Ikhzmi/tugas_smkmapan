<?php

namespace App\Http\Controllers\Api\V1;

use App\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\SchoolClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class AttendanceController extends Controller
{
    public function teacherIndex(Request $request): JsonResponse
    {
        $teacher = $request->user()->teacher;

        if (! $teacher) {
            return ApiResponse::error('Profil guru belum tersedia.', [], 403, 'GURU_PROFILE_NOT_FOUND');
        }

        $scheduleIds = Schedule::query()->where('teacher_id', $teacher->getKey())->pluck('id');

        $query = Attendance::query()
            ->with(['student', 'schoolClass', 'schedule'])
            ->whereIn('schedule_id', $scheduleIds)
            ->latest('tanggal');

        if ($request->filled('tanggal')) {
            $query->where('tanggal', $request->date('tanggal')->toDateString());
        }

        return ApiResponse::paginated($query->paginate(min(max($request->integer('per_page', 50), 1), 100)));
    }

    /**
     * Simpan presensi satu kelas sekaligus. Menggantikan loop POST/PATCH per siswa
     * di klien yang sebelumnya menghasilkan puluhan request berurutan.
     */
    public function teacherBulk(Request $request): JsonResponse
    {
        $teacher = $request->user()->teacher;

        if (! $teacher) {
            return ApiResponse::error('Profil guru belum tersedia.', [], 403, 'GURU_PROFILE_NOT_FOUND');
        }

        $data = $request->validate([
            'schedule_id' => ['required', 'uuid', 'exists:schedules,id'],
            'tanggal' => ['required', 'date_format:Y-m-d'],
            'entries' => ['required', 'array', 'min:1', 'max:200'],
            'entries.*.student_id' => ['required', 'uuid', 'distinct', 'exists:students,id'],
            'entries.*.status' => ['required', 'in:hadir,terlambat,izin,sakit,alpa'],
            'entries.*.jam_masuk' => ['nullable', 'date_format:H:i'],
            'entries.*.catatan' => ['nullable', 'string', 'max:1000'],
        ]);

        $schedule = Schedule::query()
            ->with('schoolClass')
            ->whereKey($data['schedule_id'])
            ->where('teacher_id', $teacher->getKey())
            ->firstOrFail();

        $studentIds = collect($data['entries'])->pluck('student_id')->unique()->values();
        $students = $schedule->schoolClass->students()->whereKey($studentIds)->get()->keyBy('id');

        if ($students->count() !== $studentIds->count()) {
            return ApiResponse::error(
                'Sebagian siswa bukan anggota kelas pada jadwal ini.',
                ['entries' => ['Seluruh siswa harus terdaftar di kelas jadwal tersebut.']],
                422,
                'ATTENDANCE_STUDENT_NOT_IN_CLASS',
            );
        }

        $now = now();
        $rows = collect($data['entries'])->map(fn (array $entry): array => [
            'id' => (string) Str::uuid(),
            'student_id' => $entry['student_id'],
            'class_id' => $students[$entry['student_id']]->class_id,
            'schedule_id' => $schedule->getKey(),
            'tanggal' => $data['tanggal'],
            'jam_masuk' => $entry['jam_masuk'] ?? null,
            'status' => $entry['status'],
            'metode' => 'guru',
            'catatan' => $entry['catatan'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        Attendance::query()->upsert(
            $rows,
            ['student_id', 'schedule_id', 'tanggal'],
            ['class_id', 'status', 'jam_masuk', 'catatan', 'metode', 'updated_at'],
        );

        $saved = Attendance::query()
            ->with(['student', 'schoolClass', 'schedule'])
            ->where('schedule_id', $schedule->getKey())
            ->where('tanggal', $data['tanggal'])
            ->whereIn('student_id', $studentIds)
            ->get();

        return ApiResponse::success($saved, 'Presensi berhasil disimpan untuk '.$saved->count().' siswa.');
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
        // Agregasi di SQL, bukan hidrasi seluruh baris ke PHP. Kolom `tanggal`
        // bertipe date, jadi perbandingan langsung tetap memakai index (class_id, tanggal).
        $query = Attendance::query();

        if (! empty($data['class_id'])) {
            $query->where('class_id', $data['class_id']);
        }
        if (! empty($data['date_from'])) {
            $query->where('tanggal', '>=', $data['date_from']);
        }
        if (! empty($data['date_to'])) {
            $query->where('tanggal', '<=', $data['date_to']);
        }

        $total = (clone $query)->count();

        $byStatus = (clone $query)
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn ($row): array => [$row->status => (int) $row->aggregate]);

        $perClass = (clone $query)
            ->selectRaw('class_id, status, count(*) as aggregate')
            ->groupBy('class_id', 'status')
            ->get();

        $classNames = SchoolClass::query()
            ->whereKey($perClass->pluck('class_id')->unique()->values())
            ->pluck('nama', 'id');

        $byClass = $perClass->groupBy('class_id')->map(fn ($rows, $classId): array => [
            'class_id' => $classId,
            'class_name' => $classNames[$classId] ?? null,
            'total' => (int) $rows->sum('aggregate'),
            'by_status' => $rows->mapWithKeys(fn ($row): array => [$row->status => (int) $row->aggregate]),
        ])->values();

        return ApiResponse::success([
            'total' => $total,
            'by_status' => $byStatus,
            'by_class' => $byClass,
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
