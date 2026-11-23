<?php

use App\Models\LoginEvent;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\SiteVisit;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('admin analytics aggregates events in the database and limits latest logins', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $today = now()->startOfDay();
    SiteVisit::query()->create(['visited_at' => $today->copy()->addHour(), 'path' => '/', 'role' => 'anon']);
    SiteVisit::query()->create(['visited_at' => $today->copy()->addHours(2), 'path' => '/login', 'role' => 'siswa']);
    SiteVisit::query()->create(['visited_at' => $today->copy()->subDays(8), 'path' => '/old', 'role' => 'anon']);

    foreach (range(1, 25) as $index) {
        LoginEvent::query()->create([
            'logged_in_at' => $today->copy()->addMinutes($index),
            'role' => $index % 2 === 0 ? 'siswa' : 'guru',
            'nama' => 'Akun '.$index,
        ]);
    }
    LoginEvent::query()->create(['logged_in_at' => $today->copy()->subDays(8), 'role' => 'admin', 'nama' => 'Akun lama']);

    DB::flushQueryLog();
    DB::enableQueryLog();

    $response = $this->getJson('/api/v1/admin/analytics?range=7')
        ->assertOk()
        ->assertJsonPath('data.range_days', 7)
        ->assertJsonPath('data.visits_total', 2)
        ->assertJsonPath('data.logins_total', 25)
        ->assertJsonPath('data.visits_by_role.anon', 1)
        ->assertJsonPath('data.visits_by_role.siswa', 1)
        ->assertJsonPath('data.logins_by_role.guru', 13)
        ->assertJsonPath('data.logins_by_role.siswa', 12)
        ->assertJsonCount(20, 'data.latest_logins');

    expect($response->json('data.visits_by_day'))->toBe([
        $today->toDateString() => 2,
    ]);
    expect($response->json('data.latest_logins.0.nama'))->toBe('Akun 25');

    $queries = collect(DB::getQueryLog())->pluck('query')->map(fn (string $query): string => strtolower($query));
    expect($queries->contains(fn (string $query): bool => str_contains($query, 'select * from "site_visits"')))->toBeFalse();
    expect($queries->contains(fn (string $query): bool => str_contains($query, 'select * from "login_events"') && ! str_contains($query, 'limit')))->toBeFalse();
});

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
