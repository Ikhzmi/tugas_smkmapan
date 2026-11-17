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

    /** @return list<string> */
    public static function normalizeOpsi(mixed $opsi): array
    {
        if (is_string($opsi)) {
            $decoded = json_decode($opsi, true);
            $opsi = json_last_error() === JSON_ERROR_NONE ? $decoded : [$opsi];
        }
        if (! is_array($opsi)) {
            return [];
        }
        if (array_is_list($opsi)) {
            return array_map(static fn ($item): string => (string) $item, $opsi);
        }
        ksort($opsi);

        return array_map(static fn ($item): string => (string) $item, array_values($opsi));
    }
}
