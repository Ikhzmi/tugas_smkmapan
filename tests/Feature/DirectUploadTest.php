<?php

use App\Models\Assignment;
use App\Models\Material;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Submission;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

function directUploadContext(): array
{
    $teacherUser = User::factory()->create(['role' => 'guru']);
    $teacher = Teacher::query()->create(['user_id' => $teacherUser->getKey(), 'nama' => 'Guru Upload']);
    $class = SchoolClass::query()->create(['nama' => 'X Upload', 'tingkat' => 10, 'tahun_ajaran' => '2026/2027']);
    $subject = Subject::query()->create(['kode' => 'UPL', 'nama' => 'Upload']);
    $studentUser = User::factory()->create(['role' => 'siswa']);
    $student = Student::query()->create(['user_id' => $studentUser->getKey(), 'nisn' => '9100000001', 'nama' => 'Siswa Upload', 'class_id' => $class->getKey()]);

    $material = Material::query()->create([
        'teacher_id' => $teacher->getKey(), 'judul' => 'Materi Upload', 'tipe' => 'teks',
        'class_id' => $class->getKey(), 'subject_id' => $subject->getKey(),
    ]);
    $assignment = Assignment::query()->create([
        'teacher_id' => $teacher->getKey(), 'subject_id' => $subject->getKey(),
        'class_id' => $class->getKey(), 'judul' => 'Tugas Upload', 'is_published' => true,
    ]);

    return [$teacherUser, $teacher, $class, $subject, $studentUser, $student, $material, $assignment];
}

test('material direct upload returns a presigned url when the media disk is s3', function () {
    [$teacherUser, , , , , , $material] = directUploadContext();

    config(['filesystems.media_disk' => 'supabase', 'filesystems.disks.supabase.driver' => 's3']);
    Storage::shouldReceive('disk')->once()->with('supabase')->andReturnSelf();
    Storage::shouldReceive('temporaryUploadUrl')->once()->andReturn('https://example.test/presigned-put');

    Sanctum::actingAs($teacherUser);
    $response = $this->postJson('/api/v1/guru/materials/'.$material->getKey().'/upload-url', [
        'filename' => 'materi.pdf',
        'content_type' => 'application/pdf',
        'size' => 1024,
    ])->assertOk()
        ->assertJsonPath('data.upload_url', 'https://example.test/presigned-put')
        ->assertJsonPath('data.method', 'PUT')
        ->assertJsonPath('data.headers.Content-Type', 'application/pdf');

    expect($response->json('data.path'))->toStartWith('materi/'.$material->teacher_id.'/'.$material->getKey().'/')
        ->and($response->json('data.path'))->toEndWith('.pdf');
});

test('direct upload is rejected when the configured disk is local', function () {
    [$teacherUser, , , , $studentUser, , $material, $assignment] = directUploadContext();

    Sanctum::actingAs($teacherUser);
    $this->postJson('/api/v1/guru/materials/'.$material->getKey().'/upload-url', [
        'filename' => 'materi.pdf', 'content_type' => 'application/pdf', 'size' => 1024,
    ])->assertStatus(422)->assertJsonPath('code', 'DIRECT_UPLOAD_UNSUPPORTED');

    Sanctum::actingAs($studentUser);
    $this->postJson('/api/v1/siswa/assignments/'.$assignment->getKey().'/upload-url', [
        'filename' => 'jawaban.pdf', 'content_type' => 'application/pdf', 'size' => 1024,
    ])->assertStatus(422)->assertJsonPath('code', 'DIRECT_UPLOAD_UNSUPPORTED');
});

test('teacher confirms a direct material upload and the file url is stored', function () {
    [$teacherUser, $teacher, , , , , $material] = directUploadContext();
    Storage::fake('public');
    $path = 'materi/'.$teacher->getKey().'/'.$material->getKey().'/materi.pdf';
    Storage::disk('public')->put($path, 'pdf');

    Sanctum::actingAs($teacherUser);
    $this->postJson('/api/v1/guru/materials/'.$material->getKey().'/upload-confirm', ['path' => $path])
        ->assertOk()
        ->assertJsonPath('data.tipe', 'file');

    expect($material->fresh()->file_url)->toContain($path);
});

test('material upload confirmation rejects a path outside the teacher folder', function () {
    [$teacherUser, , , , , , $material] = directUploadContext();
    Storage::fake('public');
    Storage::disk('public')->put('materi/lain/materi.pdf', 'pdf');

    Sanctum::actingAs($teacherUser);
    $this->postJson('/api/v1/guru/materials/'.$material->getKey().'/upload-confirm', ['path' => 'materi/lain/materi.pdf'])
        ->assertStatus(422)
        ->assertJsonPath('code', 'UPLOAD_PATH_INVALID');
});

test('student confirms a direct submission upload and cannot reuse another folder', function () {
    [, , , , $studentUser, $student, , $assignment] = directUploadContext();
    Storage::fake('local');
    $path = 'tugas/'.$student->getKey().'/'.$assignment->getKey().'/jawaban.pdf';
    Storage::disk('local')->put($path, 'pdf');

    Sanctum::actingAs($studentUser);
    $this->postJson('/api/v1/siswa/assignments/'.$assignment->getKey().'/submissions', [
        'file_path' => $path,
        'file_name' => 'jawaban.pdf',
        'file_size' => 3,
        'catatan' => 'Hasil unggah langsung.',
    ])->assertCreated()->assertJsonPath('data.file_path', $path);

    expect(Submission::query()->where('file_path', $path)->exists())->toBeTrue();
});

test('submission confirmation rejects a path outside the student assignment folder', function () {
    [, , , , $studentUser, , , $assignment] = directUploadContext();
    Storage::fake('local');
    Storage::disk('local')->put('tugas/lain/jawaban.pdf', 'pdf');

    Sanctum::actingAs($studentUser);
    $this->postJson('/api/v1/siswa/assignments/'.$assignment->getKey().'/submissions', [
        'file_path' => 'tugas/lain/jawaban.pdf',
    ])->assertStatus(422)->assertJsonPath('code', 'UPLOAD_PATH_INVALID');
});
