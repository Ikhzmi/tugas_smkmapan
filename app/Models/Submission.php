<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['assignment_id', 'student_id', 'file_path', 'file_name', 'file_size', 'file_url', 'catatan', 'nilai', 'feedback', 'status', 'dikumpulkan_at', 'dinilai_at'])]
class Submission extends DomainModel
{
    protected function casts(): array
    {
        return ['nilai' => 'decimal:2', 'dikumpulkan_at' => 'datetime', 'dinilai_at' => 'datetime'];
    }
}
