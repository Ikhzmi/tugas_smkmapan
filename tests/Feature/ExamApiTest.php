<?php

use App\Models\Attempt;
use App\Models\Exam;
use App\Models\Question;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('student can complete an exam without receiving the answer key', function () {
    $teacherUser = User::factory()->create(['role' => 'guru']);
    $teacher = Teacher::query()->create(['user_id' => $teacherUser->getKey(), 'nama' => 'Guru Ujian']);
    $studentUser = User::factory()->create(['role' => 'siswa']);
    $student = Student::query()->create(['user_id' => $studentUser->getKey(), 'nisn' => '8000000001', 'nama' => 'Siswa Ujian']);
    $exam = Exam::query()->create([
        'teacher_id' => $teacher->getKey(),
        'judul' => 'Ujian API',
        'durasi_menit' => 60,
        'is_active' => true,
        'butuh_kode' => false,
        'acak_soal' => false,
    ]);
    Question::query()->create([
        'exam_id' => $exam->getKey(),
        'tipe' => 'pg',
        'pertanyaan' => 'Berapakah 1 + 1?',
        'opsi' => ['A' => '2', 'B' => '3'],
        'kunci_jawaban' => 'A',
        'bobot' => 1,
    ]);

    Sanctum::actingAs($studentUser);
    $start = $this->postJson('/api/v1/siswa/exams/'.$exam->getKey().'/attempts');
    $start->assertCreated()->assertJsonMissingPath('data.questions.0.kunci_jawaban');
    $attemptId = $start->json('data.id');
    $questionId = $start->json('data.questions.0.id');

    $this->putJson('/api/v1/siswa/attempts/'.$attemptId.'/answers/'.$questionId, ['jawaban' => 'A'])->assertOk();
    $this->postJson('/api/v1/siswa/attempts/'.$attemptId.'/submit')->assertOk()->assertJsonPath('data.nilai_akhir', '100.00');
});

test('teacher exam recap aggregates attempts and returns only completed scored students', function () {
    $teacherUser = User::factory()->create(['role' => 'guru']);
    $teacher = Teacher::query()->create(['user_id' => $teacherUser->getKey(), 'nama' => 'Guru Rekap Performa']);
    $studentUser = User::factory()->create(['role' => 'siswa']);
    $student = Student::query()->create(['user_id' => $studentUser->getKey(), 'nisn' => '8000000003', 'nama' => 'Siswa Selesai']);
    $exam = Exam::query()->create([
        'teacher_id' => $teacher->getKey(), 'judul' => 'Ujian Agregasi', 'durasi_menit' => 60,
        'is_active' => true, 'acak_soal' => false,
    ]);
    Attempt::query()->create([
        'exam_id' => $exam->getKey(), 'student_id' => $student->getKey(), 'status' => 'selesai',
        'dimulai_at' => now()->subHour(), 'dikumpulkan_at' => now(), 'nilai_akhir' => 80,
    ]);
    Attempt::query()->create([
        'exam_id' => $exam->getKey(), 'student_id' => $student->getKey(), 'status' => 'selesai',
        'dimulai_at' => now()->subHours(2), 'dikumpulkan_at' => now()->subHour(), 'nilai_akhir' => 100,
    ]);
    Attempt::query()->create([
        'exam_id' => $exam->getKey(), 'student_id' => $student->getKey(), 'status' => 'dibatalkan',
        'dimulai_at' => now()->subHours(3),
    ]);
    Attempt::query()->create([
        'exam_id' => $exam->getKey(), 'student_id' => $student->getKey(), 'status' => 'selesai',
        'dimulai_at' => now()->subHours(4),
    ]);

    Sanctum::actingAs($teacherUser);
    $this->getJson('/api/v1/guru/exams/'.$exam->getKey().'/recap')
        ->assertOk()
        ->assertJsonPath('data.total_attempts', 4)
        ->assertJsonPath('data.completed_attempts', 2)
        ->assertJsonPath('data.average_score', 90)
        ->assertJsonPath('data.by_status.selesai', 3)
        ->assertJsonPath('data.by_status.dibatalkan', 1)
        ->assertJsonCount(2, 'data.students')
        ->assertJsonPath('data.students.0.score', '80.00');
});

test('teacher can read an exam recap and reset a student attempt', function () {
    $teacherUser = User::factory()->create(['role' => 'guru']);
    $teacher = Teacher::query()->create(['user_id' => $teacherUser->getKey(), 'nama' => 'Guru Rekap Ujian']);
    $studentUser = User::factory()->create(['role' => 'siswa']);
    Student::query()->create(['user_id' => $studentUser->getKey(), 'nisn' => '8000000002', 'nama' => 'Siswa Rekap']);
    $exam = Exam::query()->create([
        'teacher_id' => $teacher->getKey(), 'judul' => 'Ujian Rekap', 'durasi_menit' => 60,
        'is_active' => true, 'acak_soal' => false,
    ]);
    Question::query()->create([
        'exam_id' => $exam->getKey(), 'tipe' => 'pg', 'pertanyaan' => 'Soal rekap',
        'opsi' => ['A' => 'Benar'], 'kunci_jawaban' => 'A', 'bobot' => 1,
    ]);

    Sanctum::actingAs($studentUser);
    $attemptId = $this->postJson('/api/v1/siswa/exams/'.$exam->getKey().'/attempts')->json('data.id');

    Sanctum::actingAs($teacherUser);
    $this->getJson('/api/v1/guru/exams/'.$exam->getKey().'/recap')->assertOk()->assertJsonPath('data.total_attempts', 1);
    $this->postJson('/api/v1/guru/attempts/'.$attemptId.'/reset')->assertOk();
    $this->getJson('/api/v1/guru/exams/'.$exam->getKey().'/recap')->assertOk()->assertJsonPath('data.total_attempts', 0);
});
