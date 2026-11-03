<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['student_id', 'class_id', 'schedule_id', 'tanggal', 'jam_masuk', 'status', 'metode', 'catatan'])]
class Attendance extends DomainModel {}
