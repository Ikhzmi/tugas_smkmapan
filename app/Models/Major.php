<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['kode', 'nama', 'tagline', 'deskripsi', 'biaya_pendaftaran', 'spp_bulanan', 'warna', 'warna_soft', 'ikon', 'foto_url', 'kurikulum', 'fasilitas', 'karir', 'sertifikasi', 'is_active'])]
class Major extends DomainModel
{
    protected function casts(): array
    {
        return ['kurikulum' => 'array', 'fasilitas' => 'array', 'karir' => 'array', 'sertifikasi' => 'array', 'is_active' => 'boolean'];
    }
}
