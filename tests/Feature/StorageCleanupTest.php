<?php

use App\Models\Major;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('orphan cleanup defaults to dry run and preserves referenced files', function () {
    Storage::fake('public');
    Major::query()->create(['kode' => 'REF', 'nama' => 'Referenced', 'foto_url' => '/storage/branding/ref.jpg']);
    Storage::disk('public')->put('branding/ref.jpg', 'referenced');
    Storage::disk('public')->put('branding/orphan.jpg', 'orphan');

    $this->artisan('storage:prune-orphans --disk=public')
        ->expectsOutputToContain('1 file orphan ditemukan.')
        ->expectsOutputToContain('Dry-run')
        ->assertExitCode(0);

    Storage::disk('public')->assertExists('branding/ref.jpg');
    Storage::disk('public')->assertExists('branding/orphan.jpg');
});

test('orphan cleanup deletes only candidates when explicitly requested', function () {
    Storage::fake('public');
    Storage::disk('public')->put('branding/orphan.jpg', 'orphan');

    $this->artisan('storage:prune-orphans --disk=public --delete')->assertExitCode(0);

    Storage::disk('public')->assertMissing('branding/orphan.jpg');
});
