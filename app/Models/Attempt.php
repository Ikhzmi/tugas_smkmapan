<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['exam_id', 'student_id', 'status', 'dimulai_at', 'dikumpulkan_at', 'nilai_akhir', 'question_order', 'warnings', 'alasan_berhenti', 'dihentikan_at'])]
class Attempt extends DomainModel
{
    protected function casts(): array
    {
        return ['dimulai_at' => 'datetime', 'dikumpulkan_at' => 'datetime', 'nilai_akhir' => 'decimal:2', 'question_order' => 'array', 'dihentikan_at' => 'datetime'];
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }
}
