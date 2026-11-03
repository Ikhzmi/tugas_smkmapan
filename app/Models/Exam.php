<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['teacher_id', 'subject_id', 'judul', 'deskripsi', 'durasi_menit', 'waktu_mulai', 'waktu_selesai', 'is_active', 'is_approved', 'butuh_kode', 'admin_override', 'acak_soal'])]
class Exam extends DomainModel
{
    protected function casts(): array
    {
        return ['waktu_mulai' => 'datetime', 'waktu_selesai' => 'datetime', 'is_active' => 'boolean', 'is_approved' => 'boolean', 'butuh_kode' => 'boolean', 'admin_override' => 'boolean', 'acak_soal' => 'boolean'];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function code(): HasOne
    {
        return $this->hasOne(ExamCode::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(Attempt::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(ExamEvent::class);
    }
}
