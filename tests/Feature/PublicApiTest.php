<?php

use App\Models\Major;
use App\Models\SiteVisit;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('public content and forms are available without authentication', function () {
    Major::factory()->create([
        'kode' => 'TKJ',
        'nama' => 'Teknik Komputer dan Jaringan',
        'is_active' => true,
    ]);

    $this->getJson('/api/v1/public/majors')->assertOk()->assertJsonPath('data.0.kode', 'TKJ');
    $this->postJson('/api/v1/public/suggestions', [
        'nama' => '<b>Pengunjung</b>',
        'pesan' => '<script>alert(1)</script>Saran',
    ])->assertCreated()->assertJsonPath('data.status', 'baru');
    $this->postJson('/api/v1/public/visits', [
        'path' => '/landing',
        'session_id' => 'browser-session',
    ])->assertOk();

    expect(SiteVisit::query()->count())->toBe(1);
});

test('public forms reject invalid input', function () {
    $this->postJson('/api/v1/public/ppdb', [
        'email' => 'not-an-email',
    ])->assertStatus(422)->assertJsonValidationErrors(['nama_lengkap', 'email']);
});
