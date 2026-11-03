<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['teacher_id', 'subject_id', 'judul', 'deskripsi', 'durasi_menit', 'waktu_mulai', 'waktu_selesai', 'is_active', 'is_approved', 'butuh_kode', 'admin_override', 'acak_soal'])]
class Exam extends DomainModel
{
    protected function casts(): array
    {
        return ['waktu_mulai' => 'datetime', 'waktu_selesai' => 'datetime', 'is_active' => 'boolean', 'is_approved' => 'boolean', 'butuh_kode' => 'boolean', 'admin_override' => 'boolean', 'acak_soal' => 'boolean'];
    }
}
