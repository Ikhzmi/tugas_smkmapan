<?php

use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('admin can log in, read the current user, and log out', function () {
    User::factory()->create([
        'name' => 'Administrator',
        'email' => 'admin@smkm8medan.test',
        'role' => 'admin',
        'password' => 'password',
    ]);

    $login = $this->postJson('/api/v1/auth/login', [
        'identifier' => 'admin@smkm8medan.test',
        'password' => 'password',
    ]);

    $login->assertOk()
        ->assertJsonPath('data.user.role', 'admin')
        ->assertJsonPath('data.token_type', 'Bearer');

    $token = $login->json('data.token');
    $this->withToken($token)->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data.email', 'admin@smkm8medan.test');
    $this->withToken($token)->postJson('/api/v1/auth/logout')->assertNoContent();
    expect(PersonalAccessToken::query()->count())->toBe(0);
});

test('student can log in with NISN and only one recent device session is accepted', function () {
    $user = User::factory()->create([
        'name' => 'Siswa Satu',
        'username' => '1234567890',
        'email' => null,
        'role' => 'siswa',
        'password' => 'password',
    ]);
    Student::factory()->create([
        'user_id' => $user->getKey(),
        'nisn' => '1234567890',
        'nama' => 'Siswa Satu',
    ]);

    $first = $this->postJson('/api/v1/auth/login', [
        'identifier' => '1234567890',
        'password' => 'password',
        'device_id' => 'device-a',
        'device_label' => 'Chrome · Windows',
    ]);
    $first->assertOk()->assertJsonPath('data.session.device_id', 'device-a');

    $this->postJson('/api/v1/auth/login', [
        'identifier' => '1234567890',
        'password' => 'password',
        'device_id' => 'device-b',
        'device_label' => 'Firefox · Linux',
    ])->assertStatus(409)->assertJsonPath('code', 'SESSION_CONFLICT');
});

test('login validation and invalid credentials use safe errors', function () {
    $this->postJson('/api/v1/auth/login', [
        'identifier' => 'unknown@example.test',
        'password' => 'wrong-password',
    ])->assertUnauthorized()->assertJsonPath('code', 'INVALID_CREDENTIALS');

    $this->postJson('/api/v1/auth/login', [])->assertStatus(422)->assertJsonValidationErrors(['identifier', 'password']);
});

test('admin account routes are protected by the role middleware', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $this->postJson('/api/v1/admin/accounts', [
        'name' => 'Guru Baru',
        'username' => 'guru-baru',
        'email' => 'guru-baru@smkm8medan.test',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'guru',
    ])->assertCreated()->assertJsonMissingPath('data.password');

    $this->getJson('/api/v1/admin/accounts')->assertOk()->assertJsonPath('meta.total', 2);

    $student = User::factory()->create(['role' => 'siswa']);
    Sanctum::actingAs($student);
    $this->getJson('/api/v1/admin/accounts')->assertForbidden()->assertJsonPath('code', 'FORBIDDEN_ROLE');
});

test('login endpoint is rate limited', function () {
    foreach (range(1, 5) as $attempt) {
        $this->postJson('/api/v1/auth/login', [
            'identifier' => 'unknown@example.test',
            'password' => 'wrong-password',
        ])->assertUnauthorized();
    }

    $this->postJson('/api/v1/auth/login', [
        'identifier' => 'unknown@example.test',
        'password' => 'wrong-password',
    ])->assertStatus(429);
});
