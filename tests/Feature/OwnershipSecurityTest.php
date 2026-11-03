<?php

use App\Models\Assignment;
use App\Models\Attendance;
use App\Models\Exam;
use App\Models\Material;
use App\Models\Question;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Submission;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('users cannot access another class, teacher, submission scope, or attempt', function () {
    $teacherAUser = User::factory()->create(['role' => 'guru']);
    $teacherA = Teacher::query()->create(['user_id' => $teacherAUser->getKey(), 'nama' => 'Guru A']);
    $teacherBUser = User::factory()->create(['role' => 'guru']);
    $teacherB = Teacher::query()->create(['user_id' => $teacherBUser->getKey(), 'nama' => 'Guru B']);
    $classA = SchoolClass::query()->create(['nama' => 'X A', 'tingkat' => 10, 'tahun_ajaran' => '2026/2027']);
    $classB = SchoolClass::query()->create(['nama' => 'X B', 'tingkat' => 10, 'tahun_ajaran' => '2026/2027']);
    $subject = Subject::query()->create(['kode' => 'OWN', 'nama' => 'Ownership']);
    $studentAUser = User::factory()->create(['role' => 'siswa']);
    $studentA = Student::query()->create(['user_id' => $studentAUser->getKey(), 'nisn' => '7000000001', 'nama' => 'Siswa A', 'class_id' => $classA->getKey()]);
    $studentBUser = User::factory()->create(['role' => 'siswa']);
    Student::query()->create(['user_id' => $studentBUser->getKey(), 'nisn' => '7000000002', 'nama' => 'Siswa B', 'class_id' => $classB->getKey()]);

    $material = Material::query()->create([
        'teacher_id' => $teacherA->getKey(), 'subject_id' => $subject->getKey(), 'class_id' => $classA->getKey(),
        'judul' => 'Materi A', 'tipe' => 'teks', 'is_published' => true,
    ]);
    $assignment = Assignment::query()->create([
        'teacher_id' => $teacherA->getKey(), 'subject_id' => $subject->getKey(), 'class_id' => $classA->getKey(),
        'judul' => 'Tugas A', 'is_published' => true,
    ]);
    $submission = Submission::query()->create([
        'assignment_id' => $assignment->getKey(), 'student_id' => $studentA->getKey(),
        'status' => 'dikumpulkan', 'dikumpulkan_at' => now(),
    ]);
    $schedule = Schedule::query()->create([
        'class_id' => $classA->getKey(), 'subject_id' => $subject->getKey(), 'teacher_id' => $teacherA->getKey(),
        'hari' => 'senin', 'jam_mulai' => '07:30', 'jam_selesai' => '09:00',
    ]);
    $attendance = Attendance::query()->create([
        'student_id' => $studentA->getKey(), 'class_id' => $classA->getKey(), 'schedule_id' => $schedule->getKey(),
        'tanggal' => now()->toDateString(), 'status' => 'hadir', 'metode' => 'guru',
    ]);
    $exam = Exam::query()->create(['teacher_id' => $teacherA->getKey(), 'judul' => 'Ujian A', 'durasi_menit' => 60, 'is_active' => true, 'acak_soal' => false]);
    Question::query()->create(['exam_id' => $exam->getKey(), 'tipe' => 'pg', 'pertanyaan' => 'Soal A', 'opsi' => ['A' => 'Benar'], 'kunci_jawaban' => 'A', 'bobot' => 1]);

    Sanctum::actingAs($teacherBUser);
    $this->patchJson('/api/v1/guru/materials/'.$material->getKey(), ['judul' => 'Diubah'])->assertNotFound();
    $this->patchJson('/api/v1/guru/submissions/'.$submission->getKey().'/grade', ['nilai' => 80])->assertNotFound();
    $this->patchJson('/api/v1/guru/attendance/'.$attendance->getKey(), ['status' => 'alpa'])->assertNotFound();

    Sanctum::actingAs($studentBUser);
    $this->getJson('/api/v1/siswa/materials')->assertOk()->assertJsonCount(0, 'data');
    $this->postJson('/api/v1/siswa/assignments/'.$assignment->getKey().'/submissions', ['file_url' => 'https://example.test/a.pdf'])->assertNotFound();

    Sanctum::actingAs($studentAUser);
    $attempt = $this->postJson('/api/v1/siswa/exams/'.$exam->getKey().'/attempts')->assertCreated()->json('data.id');
    Sanctum::actingAs($studentBUser);
    $this->getJson('/api/v1/siswa/attempts/'.$attempt)->assertNotFound();
});
