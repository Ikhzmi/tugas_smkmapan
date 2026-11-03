<?php

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
