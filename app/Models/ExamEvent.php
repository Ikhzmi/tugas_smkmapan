<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['teacher_id', 'exam_id', 'attempt_id', 'student_id', 'type', 'message', 'created_at'])]
class ExamEvent extends DomainModel
{
    public const UPDATED_AT = null;

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }
}
