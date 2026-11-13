<?php

namespace App\Http\Controllers\Api\V1;

use App\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Attempt;
use App\Models\Material;
use App\Models\Submission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class LmsController extends Controller
{
    public function teacherMaterials(Request $request): JsonResponse
    {
        $teacher = $request->user()->teacher;

        if (! $teacher) {
            return ApiResponse::error('Profil guru belum tersedia.', [], 403, 'GURU_PROFILE_NOT_FOUND');
        }

        $query = Material::query()->with(['schoolClass', 'subject'])->where('teacher_id', $teacher->getKey())->latest();

        return ApiResponse::paginated($query->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function storeMaterial(Request $request): JsonResponse
    {
        $teacher = $request->user()->teacher;

        if (! $teacher) {
            return ApiResponse::error('Profil guru belum tersedia.', [], 403, 'GURU_PROFILE_NOT_FOUND');
        }

        $data = $request->validate($this->materialRules());
        $data['teacher_id'] = $teacher->getKey();

        if ($request->hasFile('file')) {
            $disk = $this->mediaDisk();
            $path = $request->file('file')->store('materi/'.$teacher->getKey(), $disk);
            $data['file_url'] = Storage::disk($disk)->url($path);
        }

        if (($data['tipe'] ?? null) === 'file' && empty($data['file_url'])) {
            return ApiResponse::error('Materi tipe file harus memiliki berkas PDF.', ['file' => ['Berkas PDF wajib diunggah.']]);
        }

        if (($data['is_published'] ?? false) && (empty($data['subject_id']) || empty($data['class_id']))) {
            return ApiResponse::error('Materi terbit harus memiliki kelas dan mata pelajaran.', [], 422, 'PUBLISHED_SCOPE_REQUIRED');
        }

        return ApiResponse::created(Material::query()->create($data)->load(['schoolClass', 'subject']), 'Materi berhasil dibuat.');
    }

    public function updateMaterial(Request $request, Material $material): JsonResponse
    {
        $teacher = $request->user()->teacher;

        if (! $teacher || $material->teacher_id !== $teacher->getKey()) {
            abort(404);
        }

        $data = $request->validate($this->materialRules(false));
        $material->update($data);

        return ApiResponse::success($material->fresh()->load(['schoolClass', 'subject']), 'Materi berhasil diperbarui.');
    }

    public function uploadMaterialFile(Request $request, Material $material): JsonResponse
    {
        $teacher = $request->user()->teacher;

        if (! $teacher || $material->teacher_id !== $teacher->getKey()) {
            abort(404);
        }

        $request->validate(['file' => ['required', 'file', 'mimes:pdf', 'max:25600']]);
        $disk = $this->mediaDisk();
        $path = $request->file('file')->store('materi/'.$teacher->getKey(), $disk);
        $material->update(['file_url' => Storage::disk($disk)->url($path), 'tipe' => 'file']);

        return ApiResponse::success($material->fresh(), 'Berkas materi berhasil diunggah.');
    }

    public function presignMaterialUpload(Request $request, Material $material): JsonResponse
    {
        $teacher = $request->user()->teacher;

        if (! $teacher || $material->teacher_id !== $teacher->getKey()) {
            abort(404);
        }

        $data = $request->validate([
            'filename' => ['required', 'string', 'max:255'],
            'content_type' => ['required', 'string', 'in:application/pdf'],
            'size' => ['required', 'integer', 'min:1', 'max:26214400'],
        ]);

        $disk = $this->mediaDisk();

        if (! $this->supportsDirectUpload($disk)) {
            return ApiResponse::error('Direct upload memerlukan disk cloud. Gunakan unggah multipart.', [], 422, 'DIRECT_UPLOAD_UNSUPPORTED');
        }

        $path = 'materi/'.$teacher->getKey().'/'.$material->getKey().'/'.Str::uuid().'.pdf';

        return ApiResponse::success($this->presignPayload($disk, $path, $data['content_type'], now()->addMinutes(15)), 'URL unggah materi dibuat.');
    }

    public function confirmMaterialUpload(Request $request, Material $material): JsonResponse
    {
        $teacher = $request->user()->teacher;

        if (! $teacher || $material->teacher_id !== $teacher->getKey()) {
            abort(404);
        }

        $data = $request->validate(['path' => ['required', 'string', 'max:2048']]);
        $disk = $this->mediaDisk();
        $prefix = 'materi/'.$teacher->getKey().'/';

        if (! str_starts_with($data['path'], $prefix)) {
            return ApiResponse::error('Path berkas tidak valid.', ['path' => ['Path berkas tidak sesuai.']], 422, 'UPLOAD_PATH_INVALID');
        }

        if (! Storage::disk($disk)->exists($data['path'])) {
            return ApiResponse::error('Berkas belum diunggah.', ['path' => ['Berkas tidak ditemukan di storage.']], 422, 'UPLOAD_NOT_FOUND');
        }

        $material->update(['file_url' => Storage::disk($disk)->url($data['path']), 'tipe' => 'file']);

        return ApiResponse::success($material->fresh(), 'Berkas materi berhasil disimpan.');
    }

    public function destroyMaterial(Request $request, Material $material): Response
    {
        $teacher = $request->user()->teacher;

        if (! $teacher || $material->teacher_id !== $teacher->getKey()) {
            abort(404);
        }

        $material->delete();

        return response()->noContent();
    }

    public function publishMaterial(Request $request, Material $material): JsonResponse
    {
        $teacher = $request->user()->teacher;

        if (! $teacher || $material->teacher_id !== $teacher->getKey()) {
            abort(404);
        }

        if (! $material->is_published && (! $material->class_id || ! $material->subject_id)) {
            return ApiResponse::error('Materi terbit harus memiliki kelas dan mata pelajaran.', [], 422, 'PUBLISHED_SCOPE_REQUIRED');
        }

        $material->update(['is_published' => ! $material->is_published]);

        return ApiResponse::success($material->fresh(), 'Status materi diperbarui.');
    }

    public function teacherAssignments(Request $request): JsonResponse
    {
        $teacher = $request->user()->teacher;

        if (! $teacher) {
            return ApiResponse::error('Profil guru belum tersedia.', [], 403, 'GURU_PROFILE_NOT_FOUND');
        }

        $assignments = Assignment::query()->with(['schoolClass', 'subject'])->where('teacher_id', $teacher->getKey())->latest()->paginate(min(max($request->integer('per_page', 20), 1), 100));

        return ApiResponse::paginated($assignments);
    }

    public function storeAssignment(Request $request): JsonResponse
    {
        $teacher = $request->user()->teacher;

        if (! $teacher) {
            return ApiResponse::error('Profil guru belum tersedia.', [], 403, 'GURU_PROFILE_NOT_FOUND');
        }

        $data = $request->validate($this->assignmentRules());
        $data['teacher_id'] = $teacher->getKey();

        if (($data['is_published'] ?? false) && (empty($data['subject_id']) || empty($data['class_id']))) {
            return ApiResponse::error('Tugas terbit harus memiliki kelas dan mata pelajaran.', [], 422, 'PUBLISHED_SCOPE_REQUIRED');
        }

        return ApiResponse::created(Assignment::query()->create($data)->load(['schoolClass', 'subject']), 'Tugas berhasil dibuat.');
    }

    public function updateAssignment(Request $request, Assignment $assignment): JsonResponse
    {
        $teacher = $request->user()->teacher;

        if (! $teacher || $assignment->teacher_id !== $teacher->getKey()) {
            abort(404);
        }

        $assignment->update($request->validate($this->assignmentRules(false)));

        return ApiResponse::success($assignment->fresh()->load(['schoolClass', 'subject']), 'Tugas berhasil diperbarui.');
    }

    public function destroyAssignment(Request $request, Assignment $assignment): Response
    {
        $teacher = $request->user()->teacher;

        if (! $teacher || $assignment->teacher_id !== $teacher->getKey()) {
            abort(404);
        }

        $assignment->delete();

        return response()->noContent();
    }

    public function publishAssignment(Request $request, Assignment $assignment): JsonResponse
    {
        $teacher = $request->user()->teacher;

        if (! $teacher || $assignment->teacher_id !== $teacher->getKey()) {
            abort(404);
        }

        if (! $assignment->is_published && (! $assignment->class_id || ! $assignment->subject_id)) {
            return ApiResponse::error('Tugas terbit harus memiliki kelas dan mata pelajaran.', [], 422, 'PUBLISHED_SCOPE_REQUIRED');
        }

        $assignment->update(['is_published' => ! $assignment->is_published]);

        return ApiResponse::success($assignment->fresh(), 'Status tugas diperbarui.');
    }

    public function assignmentSubmissions(Request $request, Assignment $assignment): JsonResponse
    {
        $teacher = $request->user()->teacher;

        if (! $teacher || $assignment->teacher_id !== $teacher->getKey()) {
            abort(404);
        }

        return ApiResponse::paginated($assignment->submissions()->with('student')->latest('dikumpulkan_at')->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function gradeSubmission(Request $request, Submission $submission): JsonResponse
    {
        $teacher = $request->user()->teacher;

        if (! $teacher || $submission->assignment?->teacher_id !== $teacher->getKey()) {
            abort(404);
        }

        $data = $request->validate(['nilai' => ['nullable', 'numeric', 'between:0,100'], 'feedback' => ['nullable', 'string', 'max:5000']]);
        $submission->update([...$data, 'status' => $data['nilai'] === null ? 'dikumpulkan' : 'dinilai', 'dinilai_at' => $data['nilai'] === null ? null : now()]);

        return ApiResponse::success($submission->fresh(), 'Pengumpulan berhasil dinilai.');
    }

    public function downloadSubmission(Request $request, Submission $submission): Response|JsonResponse
    {
        $teacher = $request->user()->teacher;

        if (! $teacher || $submission->assignment?->teacher_id !== $teacher->getKey()) {
            abort(404);
        }

        if ($submission->file_url) {
            return ApiResponse::success(['url' => $submission->file_url]);
        }

        $diskName = $this->privateDisk();
        $disk = Storage::disk($diskName);

        if (! $submission->file_path || ! $disk->exists($submission->file_path)) {
            return ApiResponse::error('Berkas tidak ditemukan.', [], 404, 'FILE_NOT_FOUND');
        }

        $expiresAt = now()->addHour();

        $url = $this->diskDriver($diskName) === 's3'
            ? $disk->temporaryUrl($submission->file_path, $expiresAt)
            : URL::temporarySignedRoute('guru.submissions.file', $expiresAt, ['submission' => $submission->getKey()]);

        return ApiResponse::success([
            'url' => $url,
            'expires_at' => $expiresAt->toISOString(),
        ]);
    }

    public function downloadSubmissionFile(Request $request, Submission $submission): Response|RedirectResponse
    {
        $teacher = $request->user()->teacher;

        if (! $teacher || $submission->assignment?->teacher_id !== $teacher->getKey()) {
            abort(404);
        }

        $diskName = $this->privateDisk();
        $disk = Storage::disk($diskName);

        if (! $submission->file_path || ! $disk->exists($submission->file_path)) {
            abort(404);
        }

        if ($this->diskDriver($diskName) === 's3') {
            return redirect()->away($disk->temporaryUrl($submission->file_path, now()->addMinutes(10)));
        }

        return response()->download($disk->path($submission->file_path), $submission->file_name ?: basename($submission->file_path));
    }

    public function studentMaterials(Request $request): JsonResponse
    {
        $student = $request->user()->student;

        if (! $student) {
            return ApiResponse::error('Profil siswa belum tersedia.', [], 403, 'SISWA_PROFILE_NOT_FOUND');
        }

        $query = Material::query()->with('subject')->where('class_id', $student->class_id)->where('is_published', true)->latest();

        return ApiResponse::paginated($query->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function studentMaterial(Request $request, Material $material): JsonResponse
    {
        $student = $request->user()->student;

        if (! $student || $material->class_id !== $student->class_id || ! $material->is_published) {
            abort(404);
        }

        return ApiResponse::success($material->load('subject'), 'Materi ditemukan.');
    }

    public function studentAssignments(Request $request): JsonResponse
    {
        $student = $request->user()->student;

        if (! $student) {
            return ApiResponse::error('Profil siswa belum tersedia.', [], 403, 'SISWA_PROFILE_NOT_FOUND');
        }

        $query = Assignment::query()->with(['subject', 'submissions' => fn ($relation) => $relation->where('student_id', $student->getKey())])->where('class_id', $student->class_id)->where('is_published', true)->latest();

        return ApiResponse::paginated($query->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function studentAssignment(Request $request, Assignment $assignment): JsonResponse
    {
        $student = $request->user()->student;

        if (! $student || $assignment->class_id !== $student->class_id || ! $assignment->is_published) {
            abort(404);
        }

        return ApiResponse::success($assignment->load(['subject', 'submissions' => fn ($relation) => $relation->where('student_id', $student->getKey())]), 'Tugas ditemukan.');
    }

    public function submitAssignment(Request $request, Assignment $assignment): JsonResponse
    {
        $student = $request->user()->student;

        if (! $student || $assignment->class_id !== $student->class_id || ! $assignment->is_published) {
            abort(404);
        }

        if ($assignment->submissions()->where('student_id', $student->getKey())->exists()) {
            return ApiResponse::error('Tugas sudah dikumpulkan.', [], 409, 'ALREADY_SUBMITTED');
        }

        $data = $request->validate([
            'file' => ['nullable', 'file', 'max:25600', 'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,zip,rar,jpg,jpeg,png,webp,txt'],
            'file_url' => ['nullable', 'url', 'max:2048'],
            'file_path' => ['nullable', 'string', 'max:2048'],
            'file_name' => ['nullable', 'string', 'max:255'],
            'file_size' => ['nullable', 'integer', 'min:0', 'max:268435456'],
            'catatan' => ['nullable', 'string', 'max:5000'],
        ]);

        if (! $request->hasFile('file') && empty($data['file_url']) && empty($data['file_path'])) {
            return ApiResponse::error('Berkas atau tautan wajib diisi.', ['file' => ['Berkas atau tautan wajib diisi.']]);
        }

        $diskName = $this->privateDisk();
        $path = null;
        $fileName = null;
        $fileSize = null;

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('tugas/'.$student->getKey().'/'.$assignment->getKey(), $diskName);
            $fileName = $request->file('file')->getClientOriginalName();
            $fileSize = $request->file('file')->getSize();
        } elseif (! empty($data['file_path'])) {
            $prefix = 'tugas/'.$student->getKey().'/'.$assignment->getKey().'/';

            if (! str_starts_with($data['file_path'], $prefix)) {
                return ApiResponse::error('Path berkas tidak valid.', ['file_path' => ['Path berkas tidak sesuai.']], 422, 'UPLOAD_PATH_INVALID');
            }

            if (! Storage::disk($diskName)->exists($data['file_path'])) {
                return ApiResponse::error('Berkas belum diunggah.', ['file_path' => ['Berkas tidak ditemukan di storage.']], 422, 'UPLOAD_NOT_FOUND');
            }

            $path = $data['file_path'];
            $fileName = $data['file_name'] ?? basename($path);
            $fileSize = $data['file_size'] ?? null;
        }

        $submission = Submission::query()->create([
            'assignment_id' => $assignment->getKey(),
            'student_id' => $student->getKey(),
            'file_path' => $path,
            'file_name' => $fileName,
            'file_size' => $fileSize,
            'file_url' => $data['file_url'] ?? null,
            'catatan' => $data['catatan'] ?? null,
            'status' => 'dikumpulkan',
            'dikumpulkan_at' => now(),
        ]);

        return ApiResponse::created($submission, 'Tugas berhasil dikumpulkan.');
    }

    public function presignSubmissionUpload(Request $request, Assignment $assignment): JsonResponse
    {
        $student = $request->user()->student;

        if (! $student || $assignment->class_id !== $student->class_id || ! $assignment->is_published) {
            abort(404);
        }

        if ($assignment->submissions()->where('student_id', $student->getKey())->exists()) {
            return ApiResponse::error('Tugas sudah dikumpulkan.', [], 409, 'ALREADY_SUBMITTED');
        }

        $data = $request->validate([
            'filename' => ['required', 'string', 'max:255'],
            'content_type' => ['required', 'string', 'in:application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/zip,application/x-rar-compressed,application/vnd.rar,image/jpeg,image/png,image/webp,text/plain'],
            'size' => ['required', 'integer', 'min:1', 'max:26214400'],
        ]);

        $disk = $this->privateDisk();

        if (! $this->supportsDirectUpload($disk)) {
            return ApiResponse::error('Direct upload memerlukan disk cloud. Gunakan unggah multipart.', [], 422, 'DIRECT_UPLOAD_UNSUPPORTED');
        }

        $extension = $this->extensionFor($data['filename'], $data['content_type']);
        $path = 'tugas/'.$student->getKey().'/'.$assignment->getKey().'/'.Str::uuid().'.'.$extension;

        return ApiResponse::success($this->presignPayload($disk, $path, $data['content_type'], now()->addMinutes(15)), 'URL unggah tugas dibuat.');
    }

    public function studentSubmissions(Request $request): JsonResponse
    {
        $student = $request->user()->student;

        if (! $student) {
            return ApiResponse::error('Profil siswa belum tersedia.', [], 403, 'SISWA_PROFILE_NOT_FOUND');
        }

        return ApiResponse::paginated($student->submissions()->with('assignment')->latest('dikumpulkan_at')->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function studentGrades(Request $request): JsonResponse
    {
        $student = $request->user()->student;

        if (! $student) {
            return ApiResponse::error('Profil siswa belum tersedia.', [], 403, 'SISWA_PROFILE_NOT_FOUND');
        }

        return ApiResponse::success([
            'assignments' => $student->submissions()->with('assignment')->whereNotNull('nilai')->latest('dinilai_at')->get(),
            'exams' => Attempt::query()->with('exam')->where('student_id', $student->getKey())->where('status', 'selesai')->latest('dikumpulkan_at')->get()->map(fn (Attempt $attempt): array => [
                'attempt_id' => $attempt->getKey(),
                'exam_id' => $attempt->exam_id,
                'exam_title' => $attempt->exam?->judul,
                'score' => $attempt->nilai_akhir,
                'submitted_at' => $attempt->dikumpulkan_at?->toISOString(),
            ]),
        ]);
    }

    private function mediaDisk(): string
    {
        return (string) config('filesystems.media_disk', 'public');
    }

    private function privateDisk(): string
    {
        return (string) config('filesystems.private_disk', 'local');
    }

    private function supportsDirectUpload(string $disk): bool
    {
        return $this->diskDriver($disk) === 's3';
    }

    private function diskDriver(string $disk): string
    {
        return (string) config("filesystems.disks.{$disk}.driver");
    }

    /** @return array<string, mixed> */
    private function presignPayload(string $disk, string $path, string $contentType, \DateTimeInterface $expiresAt): array
    {
        $url = Storage::disk($disk)->temporaryUploadUrl($path, $expiresAt, ['ContentType' => $contentType]);

        return [
            'upload_url' => $url,
            'method' => 'PUT',
            'path' => $path,
            'headers' => ['Content-Type' => $contentType],
            'expires_at' => $expiresAt->toISOString(),
        ];
    }

    private function extensionFor(string $filename, string $contentType): string
    {
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $allowed = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'jpg', 'jpeg', 'png', 'webp', 'txt'];

        if (in_array($extension, $allowed, true)) {
            return $extension;
        }

        return match ($contentType) {
            'application/pdf' => 'pdf',
            'application/msword' => 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
            'application/vnd.ms-excel' => 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
            'application/vnd.ms-powerpoint' => 'ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation' => 'pptx',
            'application/zip' => 'zip',
            'application/x-rar-compressed', 'application/vnd.rar' => 'rar',
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'text/plain' => 'txt',
            default => 'bin',
        };
    }

    /** @return array<string, mixed> */
    private function materialRules(bool $required = true): array
    {
        return [
            'judul' => [$required ? 'required' : 'sometimes', 'string', 'max:200'],
            'deskripsi' => ['nullable', 'string', 'max:10000'],
            'tipe' => [$required ? 'required' : 'sometimes', 'in:file,video,link,teks'],
            'subject_id' => ['nullable', 'uuid', 'exists:subjects,id'],
            'class_id' => ['nullable', 'uuid', 'exists:classes,id'],
            'is_published' => ['sometimes', 'boolean'],
            'file_url' => ['nullable', 'url', 'max:2048'],
            'file' => ['nullable', 'file', 'mimes:pdf', 'max:25600'],
        ];
    }

    /** @return array<string, mixed> */
    private function assignmentRules(bool $required = true): array
    {
        return [
            'judul' => [$required ? 'required' : 'sometimes', 'string', 'max:200'],
            'deskripsi' => ['nullable', 'string', 'max:10000'],
            'deadline' => ['nullable', 'date'],
            'subject_id' => ['nullable', 'uuid', 'exists:subjects,id'],
            'class_id' => ['nullable', 'uuid', 'exists:classes,id'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
