<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['judul', 'kategori', 'tanggal', 'deskripsi', 'image_url', 'rotate', 'sort_order', 'is_active'])]
class Gallery extends DomainModel
{
    protected function casts(): array
    {
        return ['tanggal' => 'date', 'rotate' => 'decimal:2', 'is_active' => 'boolean'];
    }
}
