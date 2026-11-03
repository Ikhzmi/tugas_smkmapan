<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['teacher_id', 'exam_id', 'attempt_id', 'student_id', 'type', 'message', 'created_at'])]
class ExamEvent extends DomainModel
{
    public const UPDATED_AT = null;
}
