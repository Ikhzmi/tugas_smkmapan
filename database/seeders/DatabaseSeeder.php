<?php

namespace Database\Seeders;

use App\Models\Assignment;
use App\Models\Exam;
use App\Models\ExamCode;
use App\Models\Facility;
use App\Models\Gallery;
use App\Models\Major;
use App\Models\Material;
use App\Models\Question;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use App\Models\Video;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Konten asli sekolah (identitas, jurusan, guru, fasilitas, galeri,
        // eskul, video) — dipakai landing page & CMS, terpasang di semua
        // lingkungan.
        $this->call(SchoolContentSeeder::class);

        // Akun administrator.
        User::query()->updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Administrator SMKM 8 Medan',
                'email' => 'admin@smkm8medan.test',
                'password' => 'password',
                'role' => 'admin',
            ],
        );

        // Data contoh LMS (kelas, siswa, jadwal, materi, tugas, ujian) hanya
        // untuk pengembangan — supaya database produksi tidak berisi data demo.
        if (! app()->isProduction()) {
            $this->seedLmsDemo();
        }

        Artisan::call('db:secure-rls');
    }

    /**
     * Data contoh LMS untuk lingkungan pengembangan. Jurusan mengambil dari
     * konten asli (SchoolContentSeeder), bukan placeholder.
     */
    private function seedLmsDemo(): void
    {
        $majors = Major::query()->whereIn('kode', ['TKJ', 'DKV'])
            ->get()->keyBy('kode');

        $tkj = $majors->get('TKJ');
        $dkv = $majors->get('DKV');

        if (! $tkj || ! $dkv) {
            $this->command?->warn('  [demo] Jurusan TKJ/DKV tidak ditemukan, lewati data demo LMS.');

            return;
        }

        // Akun guru contoh untuk uji login LMS (bukan tenaga pendidik asli).
        $teachers = collect(range(1, 3))->map(function (int $number): Teacher {
            $user = User::query()->updateOrCreate(
                ['username' => 'guru'.$number],
                [
                    'name' => 'Guru '.$number,
                    'email' => 'guru'.$number.'@smkm8medan.test',
                    'password' => 'password',
                    'role' => 'guru',
                ],
            );

            return Teacher::query()->updateOrCreate(
                ['nama' => 'Guru '.$number],
                [
                    'user_id' => $user->getKey(),
                    'gelar' => 'S.Pd.',
                    'jabatan' => 'Guru Mata Pelajaran',
                    'department' => $number % 2 === 0 ? 'DKV' : 'TKJ',
                    'email' => $user->email,
                    'jam_kerja' => '07:30–14:00',
                ],
            );
        });

        $classes = collect([
            ['nama' => 'X TKJ 1', 'tingkat' => 10, 'tahun_ajaran' => '2026/2027', 'major_id' => $tkj->getKey()],
            ['nama' => 'X DKV 1', 'tingkat' => 10, 'tahun_ajaran' => '2026/2027', 'major_id' => $dkv->getKey()],
        ])->map(fn (array $attributes): SchoolClass => SchoolClass::query()->updateOrCreate(
            ['nama' => $attributes['nama']],
            $attributes + ['wali_kelas_id' => $teachers->first()->getKey()],
        ));

        foreach (range(1, 10) as $number) {
            $class = $classes->get(($number - 1) % 2);
            $nisn = '202600'.str_pad((string) $number, 4, '0', STR_PAD_LEFT);
            $user = User::query()->updateOrCreate(
                ['username' => $nisn],
                [
                    'name' => 'Siswa '.$number,
                    'email' => null,
                    'password' => 'password',
                    'role' => 'siswa',
                ],
            );
            Student::query()->updateOrCreate(
                ['nisn' => $nisn],
                [
                    'user_id' => $user->getKey(),
                    'nis' => 'NIS'.$number,
                    'nama' => 'Siswa '.$number,
                    'class_id' => $class->getKey(),
                ],
            );
        }

        $subjects = collect([
            ['kode' => 'PBO', 'nama' => 'Pemrograman Berorientasi Objek', 'major_id' => $tkj->getKey()],
            ['kode' => 'DKV', 'nama' => 'Dasar Desain Komunikasi Visual', 'major_id' => $dkv->getKey()],
        ])->map(fn (array $attributes): Subject => Subject::query()->updateOrCreate(
            ['kode' => $attributes['kode']],
            $attributes,
        ));

        foreach ($classes as $classIndex => $class) {
            Schedule::query()->updateOrCreate(
                [
                    'class_id' => $class->getKey(),
                    'subject_id' => $subjects->get($classIndex)->getKey(),
                    'hari' => 'senin',
                ],
                [
                    'teacher_id' => $teachers->get($classIndex)->getKey(),
                    'jam_mulai' => '07:30',
                    'jam_selesai' => '09:00',
                ],
            );
        }

        $teacher = $teachers->first();
        $class = $classes->first();
        $subject = $subjects->first();
        Material::query()->updateOrCreate(
            ['judul' => 'Pengenalan Pemrograman', 'class_id' => $class->getKey()],
            [
                'teacher_id' => $teacher->getKey(),
                'subject_id' => $subject->getKey(),
                'deskripsi' => 'Materi contoh untuk development.',
                'tipe' => 'teks',
                'is_published' => true,
            ],
        );
        Assignment::query()->updateOrCreate(
            ['judul' => 'Latihan Algoritma Dasar', 'class_id' => $class->getKey()],
            [
                'teacher_id' => $teacher->getKey(),
                'subject_id' => $subject->getKey(),
                'deskripsi' => 'Kumpulkan jawaban dalam bentuk dokumen.',
                'deadline' => now()->addDays(7),
                'is_published' => true,
            ],
        );

        $exam = Exam::query()->updateOrCreate(
            ['judul' => 'Ujian Contoh Pemrograman'],
            [
                'teacher_id' => $teacher->getKey(),
                'subject_id' => $subject->getKey(),
                'deskripsi' => 'Ujian development dengan sepuluh soal.',
                'durasi_menit' => 60,
                'waktu_mulai' => now()->subHour(),
                'waktu_selesai' => now()->addDays(7),
                'is_active' => true,
                'butuh_kode' => true,
                'acak_soal' => true,
            ],
        );
        ExamCode::query()->updateOrCreate(
            ['exam_id' => $exam->getKey()],
            ['code' => 'SMK268', 'is_active' => true],
        );
        foreach (range(1, 10) as $number) {
            Question::query()->updateOrCreate(
                ['exam_id' => $exam->getKey(), 'pertanyaan' => 'Soal contoh nomor '.$number],
                [
                    'tipe' => 'pg',
                    'opsi' => ['A' => 'Pilihan A', 'B' => 'Pilihan B', 'C' => 'Pilihan C', 'D' => 'Pilihan D'],
                    'kunci_jawaban' => 'A',
                    'bobot' => 1,
                ],
            );
        }
    }
}
