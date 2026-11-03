<?php

use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('admin can manage majors and receive attendance summary', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $major = $this->postJson('/api/v1/admin/majors', [
        'kode' => 'TKJ',
        'nama' => 'Teknik Komputer dan Jaringan',
        'kurikulum' => ['produktif'],
    ])->assertCreated()->json('data.id');
    $this->patchJson('/api/v1/admin/majors/'.$major, ['nama' => 'TKJ Updated'])->assertOk()->assertJsonPath('data.nama', 'TKJ Updated');

    $teacherUser = User::factory()->create(['role' => 'guru']);
    $teacher = Teacher::query()->create(['user_id' => $teacherUser->getKey(), 'nama' => 'Guru Rekap']);
    $class = SchoolClass::query()->create(['nama' => 'X Rekap', 'tingkat' => 10, 'tahun_ajaran' => '2026/2027']);
    $subject = Subject::query()->create(['kode' => 'REK', 'nama' => 'Rekap']);
    $studentUser = User::factory()->create(['role' => 'siswa']);
    $student = Student::query()->create(['user_id' => $studentUser->getKey(), 'nisn' => '6000000001', 'nama' => 'Siswa Rekap', 'class_id' => $class->getKey()]);
    $schedule = Schedule::query()->create([
        'class_id' => $class->getKey(), 'subject_id' => $subject->getKey(), 'teacher_id' => $teacher->getKey(),
        'hari' => 'senin', 'jam_mulai' => '07:30', 'jam_selesai' => '09:00',
    ]);

    Sanctum::actingAs($teacherUser);
    $this->postJson('/api/v1/guru/attendance', [
        'student_id' => $student->getKey(), 'schedule_id' => $schedule->getKey(),
        'tanggal' => now()->toDateString(), 'status' => 'hadir',
    ])->assertCreated();
    Sanctum::actingAs($admin);
    $this->getJson('/api/v1/admin/classes/'.$class->getKey().'/students')->assertOk()->assertJsonCount(1, 'data');
    $this->getJson('/api/v1/admin/attendance/summary?class_id='.$class->getKey())->assertOk()->assertJsonPath('data.total', 1)->assertJsonPath('data.by_status.hadir', 1);
});
