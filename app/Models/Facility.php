<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['judul', 'kategori', 'image_url', 'specs', 'deskripsi', 'tags', 'badge', 'sort_order', 'is_active'])]
class Facility extends DomainModel
{
    protected function casts(): array
    {
        return ['tags' => 'array', 'is_active' => 'boolean'];
    }
}
