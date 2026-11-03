<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['exam_id', 'code', 'is_active'])]
class ExamCode extends DomainModel
{
    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }
}
