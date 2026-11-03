<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Subject;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AcademicController extends Controller
{
    public function classes(Request $request): JsonResponse
    {
        $query = SchoolClass::query()->with(['major', 'waliKelas'])->orderBy('tingkat')->orderBy('nama');
        $this->search($query, $request->string('q')->toString(), ['nama', 'tahun_ajaran']);

        return ApiResponse::paginated($query->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function storeClass(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:100'],
            'tingkat' => ['nullable', 'integer', 'between:10,12'],
            'tahun_ajaran' => ['required', 'string', 'max:20'],
            'major_id' => ['nullable', 'uuid', 'exists:majors,id'],
            'wali_kelas_id' => ['nullable', 'uuid', 'exists:teachers,id'],
        ]);
        $class = SchoolClass::query()->create($data);

        return ApiResponse::created($class->load(['major', 'waliKelas']), 'Kelas berhasil dibuat.');
    }

    public function updateClass(Request $request, SchoolClass $schoolClass): JsonResponse
    {
        $data = $request->validate([
            'nama' => ['sometimes', 'required', 'string', 'max:100'],
            'tingkat' => ['nullable', 'integer', 'between:10,12'],
            'tahun_ajaran' => ['sometimes', 'required', 'string', 'max:20'],
            'major_id' => ['nullable', 'uuid', 'exists:majors,id'],
            'wali_kelas_id' => ['nullable', 'uuid', 'exists:teachers,id'],
        ]);
        $schoolClass->update($data);

        return ApiResponse::success($schoolClass->fresh()->load(['major', 'waliKelas']), 'Kelas berhasil diperbarui.');
    }

    public function destroyClass(SchoolClass $schoolClass): Response
    {
        $schoolClass->delete();

        return response()->noContent();
    }

    public function subjects(Request $request): JsonResponse
    {
        $query = Subject::query()->with('major')->orderBy('nama');
        $this->search($query, $request->string('q')->toString(), ['nama', 'kode']);

        return ApiResponse::paginated($query->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function storeSubject(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kode' => ['nullable', 'string', 'max:20', 'unique:subjects,kode'],
            'nama' => ['required', 'string', 'max:150'],
            'major_id' => ['nullable', 'uuid', 'exists:majors,id'],
        ]);

        return ApiResponse::created(Subject::query()->create($data)->load('major'), 'Mata pelajaran berhasil dibuat.');
    }

    public function updateSubject(Request $request, Subject $subject): JsonResponse
    {
        $data = $request->validate([
            'kode' => ['sometimes', 'nullable', 'string', 'max:20', 'unique:subjects,kode,'.$subject->getKey()],
            'nama' => ['sometimes', 'required', 'string', 'max:150'],
            'major_id' => ['sometimes', 'nullable', 'uuid', 'exists:majors,id'],
        ]);
        $subject->update($data);

        return ApiResponse::success($subject->fresh()->load('major'), 'Mata pelajaran berhasil diperbarui.');
    }

    public function destroySubject(Subject $subject): Response
    {
        $subject->delete();

        return response()->noContent();
    }

    public function schedules(Request $request): JsonResponse
    {
        $query = Schedule::query()->with(['schoolClass', 'subject', 'teacher'])->orderBy('hari')->orderBy('jam_mulai');
        foreach (['class_id', 'teacher_id', 'hari'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }

        return ApiResponse::paginated($query->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function storeSchedule(Request $request): JsonResponse
    {
        $data = $this->scheduleData($request);
        $conflict = $this->conflict($data);

        if ($conflict) {
            return ApiResponse::error('Jadwal bertabrakan dengan jadwal lain.', ['schedule' => [$conflict]], 422, 'SCHEDULE_CONFLICT');
        }

        return ApiResponse::created(Schedule::query()->create($data)->load(['schoolClass', 'subject', 'teacher']), 'Jadwal berhasil dibuat.');
    }

    public function updateSchedule(Request $request, Schedule $schedule): JsonResponse
    {
        $data = $this->scheduleData($request);
        $conflict = $this->conflict($data, $schedule);

        if ($conflict) {
            return ApiResponse::error('Jadwal bertabrakan dengan jadwal lain.', ['schedule' => [$conflict]], 422, 'SCHEDULE_CONFLICT');
        }

        $schedule->update($data);

        return ApiResponse::success($schedule->fresh()->load(['schoolClass', 'subject', 'teacher']), 'Jadwal berhasil diperbarui.');
    }

    public function destroySchedule(Schedule $schedule): Response
    {
        $schedule->delete();

        return response()->noContent();
    }

    /** @return array<string,mixed> */
    private function scheduleData(Request $request): array
    {
        return $request->validate([
            'class_id' => ['required', 'uuid', 'exists:classes,id'],
            'subject_id' => ['required', 'uuid', 'exists:subjects,id'],
            'teacher_id' => ['nullable', 'uuid', 'exists:teachers,id'],
            'hari' => ['required', 'in:senin,selasa,rabu,kamis,jumat,sabtu'],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'],
        ]);
    }

    private function conflict(array $data, ?Schedule $ignore = null): ?string
    {
        $query = Schedule::query()
            ->where('hari', $data['hari'])
            ->where('jam_mulai', '<', $data['jam_selesai'])
            ->where('jam_selesai', '>', $data['jam_mulai'])
            ->when($ignore, fn (Builder $builder): Builder => $builder->where($ignore->getKeyName(), '!=', $ignore->getKey()))
            ->where(function (Builder $builder) use ($data): void {
                $builder->where('class_id', $data['class_id']);
                if (! empty($data['teacher_id'])) {
                    $builder->orWhere('teacher_id', $data['teacher_id']);
                }
            })
            ->first();

        return $query ? 'Kelas atau guru sudah memiliki jadwal pada rentang waktu tersebut.' : null;
    }

    /** @param list<string> $columns */
    private function search(Builder $query, string $search, array $columns): void
    {
        if ($search === '') {
            return;
        }

        $query->where(function (Builder $builder) use ($search, $columns): void {
            foreach ($columns as $index => $column) {
                $method = $index === 0 ? 'where' : 'orWhere';
                $builder->{$method}($column, 'like', '%'.$search.'%');
            }
        });
    }
}
