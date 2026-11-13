<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['nama_lengkap', 'nisn', 'asal_sekolah', 'no_hp', 'email', 'major_id', 'status'])]
class PpdbRegistration extends DomainModel {}
