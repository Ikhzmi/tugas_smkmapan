<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['attempt_id', 'question_id', 'jawaban'])]
class Answer extends DomainModel {}
