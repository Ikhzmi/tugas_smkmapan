<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['kode', 'nama', 'major_id'])]
class Subject extends DomainModel
{
    public function major(): BelongsTo
    {
        return $this->belongsTo(Major::class);
    }
}
