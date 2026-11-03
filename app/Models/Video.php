<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['judul', 'kreator', 'durasi_text', 'deskripsi', 'software', 'thumbnail_url', 'episode_no', 'kategori', 'is_published', 'sort_order'])]
class Video extends DomainModel
{
    protected function casts(): array
    {
        return ['software' => 'array', 'is_published' => 'boolean'];
    }
}
