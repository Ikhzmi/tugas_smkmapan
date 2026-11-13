<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'nama', 'gelar', 'jabatan', 'department', 'email', 'jam_kerja', 'bio', 'sertifikasi', 'foto_url', 'is_active', 'sort_order'])]
class Teacher extends DomainModel
{
    protected function casts(): array
    {
        return ['sertifikasi' => 'array', 'is_active' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class);
    }

    public function examEvents(): HasMany
    {
        return $this->hasMany(ExamEvent::class);
    }
}
