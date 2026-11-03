<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['teacher_id', 'subject_id', 'class_id', 'judul', 'deskripsi', 'deadline', 'is_published'])]
class Assignment extends DomainModel
{
    protected function casts(): array
    {
        return ['deadline' => 'datetime', 'is_published' => 'boolean'];
    }
}
