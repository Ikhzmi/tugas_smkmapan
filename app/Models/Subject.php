<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['kode', 'nama', 'major_id'])]
class Subject extends DomainModel {}
