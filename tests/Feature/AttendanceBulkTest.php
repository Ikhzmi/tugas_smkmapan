<?php

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->teacherUser = User::factory()->create(['role' => 'guru']);
    $this->teacher = Teacher::factory()->create(['user_id' => $this->teacherUser->getKey()]);
    $this->class = SchoolClass::factory()->create(['nama' => 'X Bulk']);
    $this->subject = Subject::factory()->create();
    $this->schedule = Schedule::factory()->create([
        'class_id' => $this->class->getKey(),
        'subject_id' => $this->subject->getKey(),
        'teacher_id' => $this->teacher->getKey(),
    ]);
    $this->students = Student::factory()->count(3)->create(['class_id' => $this->class->getKey()]);
    $this->tanggal = now()->toDateString();

    $this->entries = fn (string $status = 'hadir'): array => $this->students
        ->map(fn (Student $s): array => ['student_id' => $s->getKey(), 'status' => $status])
        ->all();
});

test('bulk presensi menyimpan satu kelas dalam satu request', function () {
    Sanctum::actingAs($this->teacherUser);

    $this->postJson('/api/v1/guru/attendance/bulk', [
        'schedule_id' => $this->schedule->getKey(),
        'tanggal' => $this->tanggal,
        'entries' => $this->entries(),
    ])->assertOk()->assertJsonCount(3, 'data');

    expect(Attendance::query()->count())->toBe(3);
    $this->students->each(function (Student $s) {
        $row = Attendance::query()->where('student_id', $s->getKey())->first();
        expect($row)->not->toBeNull()
            ->and($row->status)->toBe('hadir')
            ->and($row->metode)->toBe('guru')
            ->and($row->class_id)->toBe($this->class->getKey())
            ->and($row->schedule_id)->toBe($this->schedule->getKey());
    });
});

test('bulk presensi memperbarui baris yang sudah ada tanpa duplikat', function () {
    Sanctum::actingAs($this->teacherUser);

    $payload = [
        'schedule_id' => $this->schedule->getKey(),
        'tanggal' => $this->tanggal,
        'entries' => $this->entries(),
    ];
    $this->postJson('/api/v1/guru/attendance/bulk', $payload)->assertOk();
    $firstIds = Attendance::query()->pluck('id')->all();

    $payload['entries'] = $this->entries('sakit');
    $payload['entries'][0]['jam_masuk'] = '07:45';
    $payload['entries'][0]['catatan'] = 'Terlambat karena hujan';

    $this->postJson('/api/v1/guru/attendance/bulk', $payload)
        ->assertOk()
        ->assertJsonCount(3, 'data');

    expect(Attendance::query()->count())->toBe(3)
        ->and(Attendance::query()->pluck('id')->all())->toBe($firstIds);

    $updated = Attendance::query()->where('student_id', $this->students[0]->getKey())->first();
    expect($updated->status)->toBe('sakit')
        ->and($updated->jam_masuk)->toBe('07:45')
        ->and($updated->catatan)->toBe('Terlambat karena hujan');
});

test('bulk presensi menolak siswa di luar kelas dan tidak menulis sebagian', function () {
    Sanctum::actingAs($this->teacherUser);

    $outsider = Student::factory()->create(['class_id' => SchoolClass::factory()->create()->getKey()]);
    $entries = $this->entries();
    $entries[] = ['student_id' => $outsider->getKey(), 'status' => 'hadir'];

    $this->postJson('/api/v1/guru/attendance/bulk', [
        'schedule_id' => $this->schedule->getKey(),
        'tanggal' => $this->tanggal,
        'entries' => $entries,
    ])->assertStatus(422)->assertJsonPath('code', 'ATTENDANCE_STUDENT_NOT_IN_CLASS');

    expect(Attendance::query()->count())->toBe(0);
});

test('bulk presensi menolak jadwal milik guru lain', function () {
    $other = Schedule::factory()->create(['class_id' => $this->class->getKey(), 'subject_id' => $this->subject->getKey()]);
    Sanctum::actingAs($this->teacherUser);

    $this->postJson('/api/v1/guru/attendance/bulk', [
        'schedule_id' => $other->getKey(),
        'tanggal' => $this->tanggal,
        'entries' => $this->entries(),
    ])->assertNotFound();

    expect(Attendance::query()->count())->toBe(0);
});

test('bulk presensi menolak siswa ganda dan status tak dikenal', function () {
    Sanctum::actingAs($this->teacherUser);

    $duplicate = [
        ['student_id' => $this->students[0]->getKey(), 'status' => 'hadir'],
        ['student_id' => $this->students[0]->getKey(), 'status' => 'izin'],
    ];
    $this->postJson('/api/v1/guru/attendance/bulk', [
        'schedule_id' => $this->schedule->getKey(),
        'tanggal' => $this->tanggal,
        'entries' => $duplicate,
    ])->assertStatus(422);

    $this->postJson('/api/v1/guru/attendance/bulk', [
        'schedule_id' => $this->schedule->getKey(),
        'tanggal' => $this->tanggal,
        'entries' => [['student_id' => $this->students[0]->getKey(), 'status' => 'bolos']],
    ])->assertStatus(422);

    expect(Attendance::query()->count())->toBe(0);
});

test('daftar presensi guru hanya memuat jadwal miliknya', function () {
    $other = Schedule::factory()->create(['class_id' => $this->class->getKey(), 'subject_id' => $this->subject->getKey()]);
    Attendance::factory()->create([
        'student_id' => $this->students[0]->getKey(), 'class_id' => $this->class->getKey(),
        'schedule_id' => $this->schedule->getKey(), 'tanggal' => $this->tanggal,
    ]);
    Attendance::factory()->create([
        'student_id' => $this->students[1]->getKey(), 'class_id' => $this->class->getKey(),
        'schedule_id' => $other->getKey(), 'tanggal' => $this->tanggal,
    ]);

    Sanctum::actingAs($this->teacherUser);
    $this->getJson('/api/v1/guru/attendance')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.schedule_id', $this->schedule->getKey())
        ->assertJsonPath('data.0.student.id', $this->students[0]->getKey());
});

test('rekap admin menghitung agregat per kelas dan status sesuai rentang tanggal', function () {
    $otherClass = SchoolClass::factory()->create(['nama' => 'XI Rekap']);
    $otherStudent = Student::factory()->create(['class_id' => $otherClass->getKey()]);

    foreach ([$this->tanggal, now()->subDays(3)->toDateString()] as $date) {
        Attendance::factory()->create([
            'student_id' => $this->students[0]->getKey(), 'class_id' => $this->class->getKey(),
            'schedule_id' => $this->schedule->getKey(), 'tanggal' => $date, 'status' => 'hadir',
        ]);
    }
    Attendance::factory()->create([
        'student_id' => $this->students[1]->getKey(), 'class_id' => $this->class->getKey(),
        'schedule_id' => $this->schedule->getKey(), 'tanggal' => $this->tanggal, 'status' => 'izin',
    ]);
    Attendance::factory()->create([
        'student_id' => $otherStudent->getKey(), 'class_id' => $otherClass->getKey(),
        'schedule_id' => $this->schedule->getKey(), 'tanggal' => $this->tanggal, 'status' => 'alpa',
    ]);

    Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

    $this->getJson('/api/v1/admin/attendance/summary')
        ->assertOk()
        ->assertJsonPath('data.total', 4)
        ->assertJsonPath('data.by_status.hadir', 2)
        ->assertJsonPath('data.by_status.izin', 1)
        ->assertJsonPath('data.by_status.alpa', 1)
        ->assertJsonCount(2, 'data.by_class');

    $from = now()->subDay()->toDateString();
    $this->getJson('/api/v1/admin/attendance/summary?date_from='.$from.'&date_to='.$this->tanggal)
        ->assertOk()
        ->assertJsonPath('data.total', 3)
        ->assertJsonPath('data.by_status.hadir', 1);

    $this->getJson('/api/v1/admin/attendance/summary?class_id='.$this->class->getKey())
        ->assertOk()
        ->assertJsonPath('data.total', 3)
        ->assertJsonCount(1, 'data.by_class')
        ->assertJsonPath('data.by_class.0.class_id', $this->class->getKey())
        ->assertJsonPath('data.by_class.0.class_name', 'X Bulk')
        ->assertJsonPath('data.by_class.0.total', 3)
        ->assertJsonPath('data.by_class.0.by_status.hadir', 2)
        ->assertJsonPath('data.by_class.0.by_status.izin', 1);
});