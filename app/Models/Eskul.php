<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['nama', 'kategori', 'image_url', 'warna', 'warna_soft', 'deskripsi', 'jadwal', 'pembina', 'prestasi', 'jumlah_anggota', 'max_anggota', 'is_active'])]
class Eskul extends DomainModel
{
    protected $table = 'eskul';

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }
}
