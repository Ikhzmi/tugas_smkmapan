<?php

namespace App\Http\Controllers\Api\V1;

use App\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Attempt;
use App\Models\Exam;
use App\Models\ExamUnlock;
use App\Models\Question;
use App\Services\ExamService;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ExamController extends Controller
{
    public function teacherExams(Request $request): JsonResponse
    {
        $teacher = $request->user()->teacher;
        if (! $teacher) {
            return ApiResponse::error('Profil guru belum tersedia.', [], 403, 'GURU_PROFILE_NOT_FOUND');
        }

        return ApiResponse::paginated($teacher->exams()->with(['subject', 'code'])->withCount('questions')->latest()->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function storeExam(Request $request): JsonResponse
    {
        $teacher = $request->user()->teacher;
        if (! $teacher) {
            return ApiResponse::error('Profil guru belum tersedia.', [], 403, 'GURU_PROFILE_NOT_FOUND');
        }
        $data = $request->validate($this->examRules());
        $data['teacher_id'] = $teacher->getKey();

        return ApiResponse::created(Exam::query()->create($data)->load('subject'), 'Ujian berhasil dibuat.');
    }

    public function updateExam(Request $request, Exam $exam): JsonResponse
    {
        $this->ensureTeacherOwns($request, $exam);
        $exam->update($request->validate($this->examRules(false)));

        return ApiResponse::success($exam->fresh()->load('subject'), 'Ujian berhasil diperbarui.');
    }

    public function destroyExam(Request $request, Exam $exam): Response
    {
        $this->ensureTeacherOwns($request, $exam);
        $exam->delete();

        return response()->noContent();
    }

    public function storeQuestion(Request $request, Exam $exam): JsonResponse
    {
        $this->ensureTeacherOwns($request, $exam);
        $data = $request->validate([
            'tipe' => ['required', 'in:pg,essay'],
            'pertanyaan' => ['required', 'string', 'max:10000'],
            'opsi' => ['nullable', 'array'],
            'kunci_jawaban' => ['nullable', 'string', 'max:1'],
            'bobot' => ['required', 'numeric', 'min:0.01', 'max:100'],
            'gambar_url' => ['nullable', 'url', 'max:2048'],
        ]);

        return ApiResponse::created($exam->questions()->create($data), 'Soal berhasil dibuat.');
    }

    public function updateQuestion(Request $request, Question $question): JsonResponse
    {
        $this->ensureTeacherOwns($request, $question->exam);
        $data = $request->validate([
            'tipe' => ['sometimes', 'in:pg,essay'],
            'pertanyaan' => ['sometimes', 'required', 'string', 'max:10000'],
            'opsi' => ['nullable', 'array'],
            'kunci_jawaban' => ['nullable', 'string', 'max:1'],
            'bobot' => ['sometimes', 'numeric', 'min:0.01', 'max:100'],
            'gambar_url' => ['nullable', 'url', 'max:2048'],
        ]);
        $question->update($data);

        return ApiResponse::success($question->fresh(), 'Soal berhasil diperbarui.');
    }

    public function destroyQuestion(Request $request, Question $question): Response
    {
        $this->ensureTeacherOwns($request, $question->exam);
        $question->delete();

        return response()->noContent();
    }

    public function generateCode(Request $request, Exam $exam, ExamService $service): JsonResponse
    {
        $this->ensureTeacherOwns($request, $exam);
        $data = $request->validate(['length' => ['sometimes', 'integer', 'between:4,10']]);
        $code = $service->generateCode($exam, $data['length'] ?? 6);

        return ApiResponse::success(['code' => $code, 'is_active' => true], 'Kode ujian dibuat.');
    }

    public function teacherAttempts(Request $request, Exam $exam): JsonResponse
    {
        $this->ensureTeacherOwns($request, $exam);

        return ApiResponse::paginated($exam->attempts()->with('student')->latest('dimulai_at')->paginate(min(max($request->integer('per_page', 50), 1), 100)));
    }

    public function recap(Request $request, Exam $exam): JsonResponse
    {
        $this->ensureTeacherOwns($request, $exam);
        $attempts = $exam->attempts()->with('student')->get();
        $completed = $attempts->where('status', 'selesai')->filter(fn ($attempt): bool => $attempt->nilai_akhir !== null);

        return ApiResponse::success([
            'exam_id' => $exam->getKey(),
            'total_attempts' => $attempts->count(),
            'completed_attempts' => $completed->count(),
            'average_score' => $completed->isEmpty() ? null : round((float) $completed->avg('nilai_akhir'), 2),
            'by_status' => $attempts->groupBy('status')->map->count(),
            'students' => $completed->map(fn ($attempt): array => [
                'attempt_id' => $attempt->getKey(),
                'student_id' => $attempt->student_id,
                'student_name' => $attempt->student?->nama,
                'score' => $attempt->nilai_akhir,
                'submitted_at' => $attempt->dikumpulkan_at?->toISOString(),
            ])->values(),
        ]);
    }

    public function resetAttempt(Request $request, Attempt $attempt): JsonResponse
    {
        $this->ensureTeacherOwns($request, $attempt->exam);
        DB::transaction(fn (): ?bool => $attempt->delete());

        return ApiResponse::success(null, 'Attempt direset.');
    }

    public function terminateManaged(Request $request, Attempt $attempt, ExamService $service): JsonResponse
    {
        $this->ensureTeacherOwns($request, $attempt->exam);
        $data = $request->validate(['alasan' => ['required', 'string', 'max:500']]);

        return $this->result($service->terminate($attempt, $data['alasan']));
    }

    public function events(Request $request): JsonResponse
    {
        $teacher = $request->user()->teacher;
        if (! $teacher) {
            return ApiResponse::error('Profil guru belum tersedia.', [], 403, 'GURU_PROFILE_NOT_FOUND');
        }
        $query = $teacher->examEvents()->latest('created_at');
        if ($request->filled('since')) {
            $query->where('created_at', '>', $request->date('since'));
        }

        return ApiResponse::paginated($query->paginate(min(max($request->integer('per_page', 50), 1), 100)));
    }

    public function studentExams(Request $request): JsonResponse
    {
        $student = $request->user()->student;
        if (! $student) {
            return ApiResponse::error('Profil siswa belum tersedia.', [], 403, 'SISWA_PROFILE_NOT_FOUND');
        }

        $exams = Exam::query()->withCount('questions')->where('is_active', true)->with(['subject', 'attempts' => fn (Relation $relation): Relation => $relation->where('student_id', $student->getKey())])->latest()->paginate(min(max($request->integer('per_page', 20), 1), 100));

        return ApiResponse::paginated($exams);
    }

    public function hasUnlock(Request $request, Exam $exam): JsonResponse
    {
        $student = $request->user()->student;
        if (! $student) {
            return ApiResponse::error('Profil siswa belum tersedia.', [], 403, 'SISWA_PROFILE_NOT_FOUND');
        }

        return ApiResponse::success(['unlocked' => ExamUnlock::query()->where('exam_id', $exam->getKey())->where('student_id', $student->getKey())->exists()]);
    }

    public function unlock(Request $request, Exam $exam, ExamService $service): JsonResponse
    {
        $student = $request->user()->student;
        if (! $student) {
            return ApiResponse::error('Profil siswa belum tersedia.', [], 403, 'SISWA_PROFILE_NOT_FOUND');
        }
        $data = $request->validate(['code' => ['required', 'string', 'min:4', 'max:10']]);
        if (! $service->unlock($exam, $student, $data['code'])) {
            return ApiResponse::error('Kode ujian salah.', ['code' => ['Kode tidak valid.']], 422, 'INVALID_EXAM_CODE');
        }

        return ApiResponse::success(['unlocked' => true], 'Ujian berhasil dibuka.');
    }

    public function start(Request $request, Exam $exam, ExamService $service): JsonResponse
    {
        $student = $request->user()->student;
        if (! $student) {
            return ApiResponse::error('Profil siswa belum tersedia.', [], 403, 'SISWA_PROFILE_NOT_FOUND');
        }

        return $this->result($service->start($exam, $student));
    }

    public function attempt(Request $request, Attempt $attempt, ExamService $service): JsonResponse
    {
        $this->ensureStudentOwns($request, $attempt);

        return ApiResponse::success($service->payload($attempt));
    }

    public function answer(Request $request, Attempt $attempt, string $question, ExamService $service): JsonResponse
    {
        $this->ensureStudentOwns($request, $attempt);
        $data = $request->validate(['jawaban' => ['nullable', 'string', 'max:1000']]);

        return $this->result($service->answer($attempt, $question, $data['jawaban'] ?? null));
    }

    public function warning(Request $request, Attempt $attempt, ExamService $service): JsonResponse
    {
        $this->ensureStudentOwns($request, $attempt);

        return $this->result($service->warning($attempt));
    }

    public function submit(Request $request, Attempt $attempt, ExamService $service): JsonResponse
    {
        $this->ensureStudentOwns($request, $attempt);

        return $this->result($service->submit($attempt));
    }

    public function terminate(Request $request, Attempt $attempt, ExamService $service): JsonResponse
    {
        $this->ensureStudentOwns($request, $attempt);
        $data = $request->validate(['alasan' => ['required', 'string', 'max:500']]);

        return $this->result($service->terminate($attempt, $data['alasan']));
    }

    /** @param array{status:int,message:string,code?:string,data?:mixed} $result */
    private function result(array $result): JsonResponse
    {
        if ($result['status'] >= 400) {
            return ApiResponse::error($result['message'], [], $result['status'], $result['code'] ?? null);
        }

        return ApiResponse::success($result['data'] ?? null, $result['message'], [], $result['status']);
    }

    private function ensureTeacherOwns(Request $request, Exam $exam): void
    {
        if ($request->user()->role === 'admin') {
            return;
        }

        if (! $request->user()->teacher || $exam->teacher_id !== $request->user()->teacher->getKey()) {
            abort(404);
        }
    }

    private function ensureStudentOwns(Request $request, Attempt $attempt): void
    {
        if (! $request->user()->student || $attempt->student_id !== $request->user()->student->getKey()) {
            abort(404);
        }
    }

    /** @return array<string, mixed> */
    private function examRules(bool $required = true): array
    {
        return [
            'subject_id' => ['nullable', 'uuid', 'exists:subjects,id'],
            'judul' => [$required ? 'required' : 'sometimes', 'string', 'max:200'],
            'deskripsi' => ['nullable', 'string', 'max:10000'],
            'durasi_menit' => [$required ? 'required' : 'sometimes', 'integer', 'between:1,600'],
            'waktu_mulai' => ['nullable', 'date'],
            'waktu_selesai' => ['nullable', 'date', 'after:waktu_mulai'],
            'is_active' => ['sometimes', 'boolean'],
            'is_approved' => ['sometimes', 'boolean'],
            'butuh_kode' => ['sometimes', 'boolean'],
            'admin_override' => ['sometimes', 'boolean'],
            'acak_soal' => ['sometimes', 'boolean'],
        ];
    }
}
