<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['teacher_id', 'subject_id', 'class_id', 'judul', 'deskripsi', 'tipe', 'file_url', 'is_published'])]
class Material extends DomainModel
{
    protected function casts(): array
    {
        return ['is_published' => 'boolean'];
    }
}
