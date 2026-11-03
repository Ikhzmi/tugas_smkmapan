<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['exam_id', 'student_id', 'status', 'dimulai_at', 'dikumpulkan_at', 'nilai_akhir', 'question_order', 'warnings', 'alasan_berhenti', 'dihentikan_at'])]
class Attempt extends DomainModel
{
    protected function casts(): array
    {
        return ['dimulai_at' => 'datetime', 'dikumpulkan_at' => 'datetime', 'nilai_akhir' => 'decimal:2', 'question_order' => 'array', 'dihentikan_at' => 'datetime'];
    }
}
