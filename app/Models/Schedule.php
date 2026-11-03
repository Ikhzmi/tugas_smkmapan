<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['class_id', 'subject_id', 'teacher_id', 'hari', 'jam_mulai', 'jam_selesai'])]
class Schedule extends DomainModel {}
