<?php

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('admin dapat membuat akun login saat mengedit guru yang belum punya akun', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $teacher = Teacher::query()->create(['nama' => 'Guru Tanpa Akun']);

    $response = $this->patchJson("/api/v1/admin/teachers/{$teacher->getKey()}", [
        'nama' => 'Guru Tanpa Akun',
        'jabatan' => 'Guru Produktif',
        'create_account' => true,
        'username' => 'guru.tanpa',
        'password' => 'rahasia12345',
        'password_confirmation' => 'rahasia12345',
    ])->assertOk();

    $userId = $response->json('data.teacher.user_id');
    expect($userId)->not->toBeNull();

    $user = User::query()->where('username', 'guru.tanpa')->first();
    expect($user)->not->toBeNull()
        ->and($user->role)->toBe('guru')
        ->and($user->name)->toBe('Guru Tanpa Akun');

    $teacher->refresh();
    expect($teacher->user_id)->toBe($user->getKey())
        ->and($teacher->jabatan)->toBe('Guru Produktif');
});

test('edit guru yang sudah punya akun menolak pembuatan akun kedua', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $guruUser = User::factory()->create(['role' => 'guru']);
    $teacher = Teacher::query()->create([
        'user_id' => $guruUser->getKey(),
        'nama' => 'Guru Berakun',
    ]);

    $this->patchJson("/api/v1/admin/teachers/{$teacher->getKey()}", [
        'nama' => 'Guru Berakun',
        'create_account' => true,
        'username' => 'guru.kedua',
        'password' => 'rahasia12345',
        'password_confirmation' => 'rahasia12345',
    ])->assertStatus(409);

    expect($teacher->fresh()->user_id)->toBe($guruUser->getKey());
    expect(User::query()->where('username', 'guru.kedua')->exists())->toBeFalse();
});

test('edit profil guru tanpa create_account tetap berjalan seperti sebelumnya', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $teacher = Teacher::query()->create(['nama' => 'Guru Biasa']);

    $this->patchJson("/api/v1/admin/teachers/{$teacher->getKey()}", [
        'nama' => 'Guru Biasa',
        'department' => 'Akademik',
    ])->assertOk()
        ->assertJsonPath('data.teacher.department', 'Akademik');

    expect($teacher->fresh()->user_id)->toBeNull();
});

test('username titik pada pembuatan guru baru tidak diubah menjadi tanda hubung', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $this->postJson('/api/v1/admin/teachers', [
        'nama' => 'Guru Baru',
        'create_account' => true,
        'username' => 'guru.baru',
        'password' => 'rahasia12345',
        'password_confirmation' => 'rahasia12345',
    ])->assertCreated();

    expect(User::query()->where('username', 'guru.baru')->exists())->toBeTrue();
});
