<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['nama', 'tingkat', 'tahun_ajaran', 'major_id', 'wali_kelas_id'])]
class SchoolClass extends DomainModel
{
    protected $table = 'classes';

    public function major(): BelongsTo
    {
        return $this->belongsTo(Major::class);
    }

    public function waliKelas(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'wali_kelas_id');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'class_id');
    }
}
