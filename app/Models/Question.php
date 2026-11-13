<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['exam_id', 'tipe', 'pertanyaan', 'opsi', 'kunci_jawaban', 'bobot', 'gambar_url'])]
class Question extends DomainModel
{
    protected function casts(): array
    {
        return ['opsi' => 'array', 'bobot' => 'decimal:2'];
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }
}
