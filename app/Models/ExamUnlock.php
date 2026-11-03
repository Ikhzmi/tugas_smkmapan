<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['exam_id', 'student_id', 'unlocked_at'])]
class ExamUnlock extends DomainModel
{
    protected function casts(): array
    {
        return ['unlocked_at' => 'datetime'];
    }
}
