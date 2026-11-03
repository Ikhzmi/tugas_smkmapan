<?php

use App\Models\Assignment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('teacher publishes LMS content and student submits one assignment', function () {
    Storage::fake('local');
    $teacherUser = User::factory()->create(['role' => 'guru']);
    $teacher = Teacher::query()->create(['user_id' => $teacherUser->getKey(), 'nama' => 'Guru Test']);
    $class = SchoolClass::query()->create(['nama' => 'X Test', 'tingkat' => 10, 'tahun_ajaran' => '2026/2027']);
    $subject = Subject::query()->create(['kode' => 'TST', 'nama' => 'Testing']);
    $studentUser = User::factory()->create(['role' => 'siswa']);
    $student = Student::query()->create(['user_id' => $studentUser->getKey(), 'nisn' => '9000000001', 'nama' => 'Siswa Test', 'class_id' => $class->getKey()]);

    Sanctum::actingAs($teacherUser);
    $this->postJson('/api/v1/guru/materials', [
        'judul' => 'Materi Test',
        'tipe' => 'teks',
        'deskripsi' => 'Isi materi',
        'class_id' => $class->getKey(),
        'subject_id' => $subject->getKey(),
        'is_published' => true,
    ])->assertCreated();

    $assignment = Assignment::query()->create([
        'teacher_id' => $teacher->getKey(),
        'subject_id' => $subject->getKey(),
        'class_id' => $class->getKey(),
        'judul' => 'Tugas Test',
        'is_published' => true,
    ]);

    Sanctum::actingAs($studentUser);
    $this->getJson('/api/v1/siswa/materials')->assertOk()->assertJsonCount(1, 'data');
    $this->post('/api/v1/siswa/assignments/'.$assignment->getKey().'/submissions', [
        'file' => UploadedFile::fake()->create('jawaban.pdf', 10, 'application/pdf'),
        'catatan' => 'Keterangan',
    ])->assertCreated();
    $this->postJson('/api/v1/siswa/assignments/'.$assignment->getKey().'/submissions', [
        'file_url' => 'https://example.test/second.pdf',
    ])->assertStatus(409)->assertJsonPath('code', 'ALREADY_SUBMITTED');
});
