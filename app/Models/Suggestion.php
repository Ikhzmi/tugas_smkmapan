<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['nama', 'email', 'no_hp', 'kategori', 'pesan', 'status'])]
class Suggestion extends DomainModel {}
