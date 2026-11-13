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
use App\Models\SiteSetting;
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
        $admin = User::query()->create([
            'name' => 'Administrator SMKM 8 Medan',
            'username' => 'admin',
            'email' => 'admin@smkm8medan.test',
            'password' => 'password',
            'role' => 'admin',
        ]);

        $majors = collect([
            ['kode' => 'TKJ', 'nama' => 'Teknik Komputer dan Jaringan'],
            ['kode' => 'DKV', 'nama' => 'Desain Komunikasi Visual'],
        ])->mapWithKeys(function (array $attributes): array {
            $major = Major::query()->create($attributes + [
                'deskripsi' => 'Program keahlian contoh untuk development.',
                'kurikulum' => ['produktif', 'projek'],
                'karir' => ['Teknisi', 'Desainer'],
            ]);

            return [$major->kode => $major];
        });

        $teachers = collect(range(1, 3))->map(function (int $number): Teacher {
            $user = User::query()->create([
                'name' => 'Guru '.$number,
                'username' => 'guru'.$number,
                'email' => 'guru'.$number.'@smkm8medan.test',
                'password' => 'password',
                'role' => 'guru',
            ]);

            return Teacher::query()->create([
                'user_id' => $user->getKey(),
                'nama' => 'Guru '.$number,
                'gelar' => 'S.Pd.',
                'jabatan' => 'Guru Mata Pelajaran',
                'department' => $number % 2 === 0 ? 'DKV' : 'TKJ',
                'email' => $user->email,
                'jam_kerja' => '07:30–14:00',
            ]);
        });

        $classes = collect([
            ['nama' => 'X TKJ 1', 'tingkat' => 10, 'tahun_ajaran' => '2026/2027', 'major_id' => $majors['TKJ']->getKey()],
            ['nama' => 'X DKV 1', 'tingkat' => 10, 'tahun_ajaran' => '2026/2027', 'major_id' => $majors['DKV']->getKey()],
        ])->map(fn (array $attributes): SchoolClass => SchoolClass::query()->create($attributes + ['wali_kelas_id' => $teachers->first()->getKey()]));

        foreach (range(1, 10) as $number) {
            $class = $classes->get(($number - 1) % 2);
            $nisn = '202600'.str_pad((string) $number, 4, '0', STR_PAD_LEFT);
            $user = User::query()->create([
                'name' => 'Siswa '.$number,
                'username' => $nisn,
                'email' => null,
                'password' => 'password',
                'role' => 'siswa',
            ]);
            Student::query()->create([
                'user_id' => $user->getKey(),
                'nisn' => $nisn,
                'nis' => 'NIS'.$number,
                'nama' => 'Siswa '.$number,
                'class_id' => $class->getKey(),
            ]);
        }

        $subjects = collect([
            ['kode' => 'PBO', 'nama' => 'Pemrograman Berorientasi Objek', 'major_id' => $majors['TKJ']->getKey()],
            ['kode' => 'DKV', 'nama' => 'Dasar Desain Komunikasi Visual', 'major_id' => $majors['DKV']->getKey()],
        ])->map(fn (array $attributes): Subject => Subject::query()->create($attributes));

        foreach ($classes as $classIndex => $class) {
            Schedule::query()->create([
                'class_id' => $class->getKey(),
                'subject_id' => $subjects->get($classIndex)->getKey(),
                'teacher_id' => $teachers->get($classIndex)->getKey(),
                'hari' => 'senin',
                'jam_mulai' => '07:30',
                'jam_selesai' => '09:00',
            ]);
        }

        $teacher = $teachers->first();
        $class = $classes->first();
        $subject = $subjects->first();
        Material::query()->create([
            'teacher_id' => $teacher->getKey(),
            'subject_id' => $subject->getKey(),
            'class_id' => $class->getKey(),
            'judul' => 'Pengenalan Pemrograman',
            'deskripsi' => 'Materi contoh untuk development.',
            'tipe' => 'teks',
            'is_published' => true,
        ]);
        Assignment::query()->create([
            'teacher_id' => $teacher->getKey(),
            'subject_id' => $subject->getKey(),
            'class_id' => $class->getKey(),
            'judul' => 'Latihan Algoritma Dasar',
            'deskripsi' => 'Kumpulkan jawaban dalam bentuk dokumen.',
            'deadline' => now()->addDays(7),
            'is_published' => true,
        ]);

        $exam = Exam::query()->create([
            'teacher_id' => $teacher->getKey(),
            'subject_id' => $subject->getKey(),
            'judul' => 'Ujian Contoh Pemrograman',
            'deskripsi' => 'Ujian development dengan sepuluh soal.',
            'durasi_menit' => 60,
            'waktu_mulai' => now()->subHour(),
            'waktu_selesai' => now()->addDays(7),
            'is_active' => true,
            'butuh_kode' => true,
            'acak_soal' => true,
        ]);
        ExamCode::query()->create(['exam_id' => $exam->getKey(), 'code' => 'SMK268', 'is_active' => true]);
        foreach (range(1, 10) as $number) {
            Question::query()->create([
                'exam_id' => $exam->getKey(),
                'tipe' => 'pg',
                'pertanyaan' => 'Soal contoh nomor '.$number,
                'opsi' => ['A' => 'Pilihan A', 'B' => 'Pilihan B', 'C' => 'Pilihan C', 'D' => 'Pilihan D'],
                'kunci_jawaban' => 'A',
                'bobot' => 1,
            ]);
        }

        SiteSetting::query()->create(['key' => 'sekolah', 'value' => ['nama' => 'SMKM 8 Medan', 'npsn' => '00000000']]);
        SiteSetting::query()->create(['key' => 'hero', 'value' => ['eyebrow' => 'Sekolah Menengah Kejuruan']]);
        SiteSetting::query()->create(['key' => 'ujian', 'value' => ['fitur_aktif' => true]]);
        Facility::query()->create(['judul' => 'Laboratorium Komputer', 'deskripsi' => 'Fasilitas pembelajaran digital.', 'is_active' => true]);
        Gallery::query()->create(['judul' => 'Kegiatan Sekolah', 'deskripsi' => 'Contoh galeri.', 'is_active' => true]);
        Video::query()->create(['judul' => 'Profil SMKM 8 Medan', 'kategori' => 'showreel', 'is_published' => true]);

        Artisan::call('db:secure-rls');
    }
}
