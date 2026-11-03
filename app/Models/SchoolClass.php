<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['nama', 'tingkat', 'tahun_ajaran', 'major_id', 'wali_kelas_id'])]
class SchoolClass extends DomainModel
{
    protected $table = 'classes';
}
