<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('personal_access_token_id')->nullable()->constrained('personal_access_tokens')->nullOnDelete();
            $table->string('device_id', 100);
            $table->string('device_label', 100)->nullable();
            $table->timestampTz('last_seen_at');
            $table->timestampTz('revoked_at')->nullable();
            $table->timestampsTz();
            $table->index(['user_id', 'last_seen_at']);
        });

        Schema::create('site_settings', function (Blueprint $table) {
            $table->string('key', 50)->primary();
            $table->jsonb('value')->default('{}');
            $table->timestampsTz();
        });

        Schema::create('majors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kode', 20)->unique();
            $table->string('nama', 150);
            $table->string('tagline')->nullable();
            $table->text('deskripsi')->nullable();
            $table->unsignedInteger('biaya_pendaftaran')->default(0);
            $table->unsignedInteger('spp_bulanan')->default(0);
            $table->string('warna', 20)->nullable();
            $table->string('warna_soft', 20)->nullable();
            $table->string('ikon', 50)->nullable();
            $table->text('foto_url')->nullable();
            $table->jsonb('kurikulum')->default('[]');
            $table->jsonb('fasilitas')->default('[]');
            $table->jsonb('karir')->default('[]');
            $table->jsonb('sertifikasi')->default('[]');
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });

        Schema::create('teachers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->unique()->constrained('users')->nullOnDelete();
            $table->string('nama', 150);
            $table->string('gelar', 100)->nullable();
            $table->string('jabatan', 100)->nullable();
            $table->string('department', 100)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('jam_kerja', 100)->nullable();
            $table->text('bio')->nullable();
            $table->jsonb('sertifikasi')->default('[]');
            $table->text('foto_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestampsTz();
            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('classes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nama', 100);
            $table->unsignedSmallInteger('tingkat')->nullable();
            $table->string('tahun_ajaran', 20);
            $table->foreignUuid('major_id')->nullable()->constrained('majors')->nullOnDelete();
            $table->foreignUuid('wali_kelas_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->timestampsTz();
            $table->unique(['nama', 'tahun_ajaran']);
        });

        Schema::create('students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->unique()->constrained('users')->nullOnDelete();
            $table->string('nisn', 20)->unique();
            $table->string('nis', 20)->nullable();
            $table->string('nama', 150);
            $table->string('no_hp', 30)->nullable();
            $table->text('alamat')->nullable();
            $table->foreignUuid('class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->timestampsTz();
            $table->index(['class_id', 'nama']);
        });

        Schema::create('subjects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kode', 20)->nullable()->unique();
            $table->string('nama', 150);
            $table->foreignUuid('major_id')->nullable()->constrained('majors')->nullOnDelete();
            $table->timestampsTz();
        });

        Schema::create('schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignUuid('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->string('hari', 10);
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->timestampsTz();
            $table->index(['teacher_id', 'hari']);
            $table->index(['class_id', 'hari']);
        });

        Schema::create('materials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->foreignUuid('subject_id')->nullable()->constrained('subjects')->nullOnDelete();
            $table->foreignUuid('class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->string('judul', 200);
            $table->text('deskripsi')->nullable();
            $table->string('tipe', 10);
            $table->text('file_url')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestampsTz();
            $table->index(['class_id', 'is_published']);
            $table->index('teacher_id');
        });

        Schema::create('assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->foreignUuid('subject_id')->nullable()->constrained('subjects')->nullOnDelete();
            $table->foreignUuid('class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->string('judul', 200);
            $table->text('deskripsi')->nullable();
            $table->timestampTz('deadline')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestampsTz();
            $table->index(['class_id', 'is_published']);
            $table->index('teacher_id');
        });

        Schema::create('submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('assignment_id')->constrained('assignments')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->text('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->text('file_url')->nullable();
            $table->text('catatan')->nullable();
            $table->decimal('nilai', 5, 2)->nullable();
            $table->text('feedback')->nullable();
            $table->string('status', 15)->default('dikumpulkan');
            $table->timestampTz('dikumpulkan_at')->nullable();
            $table->timestampTz('dinilai_at')->nullable();
            $table->timestampsTz();
            $table->unique(['assignment_id', 'student_id']);
            $table->index('student_id');
        });

        Schema::create('attendance', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignUuid('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignUuid('schedule_id')->nullable()->constrained('schedules')->nullOnDelete();
            $table->date('tanggal');
            $table->time('jam_masuk')->nullable();
            $table->string('status', 10);
            $table->string('metode', 10);
            $table->text('catatan')->nullable();
            $table->timestampsTz();
            $table->unique(['student_id', 'schedule_id', 'tanggal']);
            $table->index(['class_id', 'tanggal']);
        });

        Schema::create('exams', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->foreignUuid('subject_id')->nullable()->constrained('subjects')->nullOnDelete();
            $table->string('judul', 200);
            $table->text('deskripsi')->nullable();
            $table->unsignedInteger('durasi_menit')->default(60);
            $table->timestampTz('waktu_mulai')->nullable();
            $table->timestampTz('waktu_selesai')->nullable();
            $table->boolean('is_active')->default(false);
            $table->boolean('is_approved')->default(true);
            $table->boolean('butuh_kode')->default(false);
            $table->boolean('admin_override')->default(false);
            $table->boolean('acak_soal')->default(true);
            $table->timestampsTz();
            $table->index(['teacher_id', 'is_active']);
        });

        Schema::create('questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->string('tipe', 10)->default('pg');
            $table->text('pertanyaan');
            $table->jsonb('opsi')->default('[]');
            $table->string('kunci_jawaban', 1)->nullable();
            $table->decimal('bobot', 5, 2)->default(1);
            $table->text('gambar_url')->nullable();
            $table->timestampsTz();
            $table->index('exam_id');
        });

        Schema::create('exam_codes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('exam_id')->unique()->constrained('exams')->cascadeOnDelete();
            $table->string('code', 10);
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });

        Schema::create('exam_unlocks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->timestampTz('unlocked_at');
            $table->timestampsTz();
            $table->unique(['exam_id', 'student_id']);
        });

        Schema::create('attempts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->string('status', 12)->default('berjalan');
            $table->timestampTz('dimulai_at');
            $table->timestampTz('dikumpulkan_at')->nullable();
            $table->decimal('nilai_akhir', 5, 2)->nullable();
            $table->jsonb('question_order')->nullable();
            $table->unsignedSmallInteger('warnings')->default(0);
            $table->text('alasan_berhenti')->nullable();
            $table->timestampTz('dihentikan_at')->nullable();
            $table->timestampsTz();
            $table->index(['exam_id', 'student_id']);
            $table->index(['student_id', 'status']);
        });

        Schema::create('answers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('attempt_id')->constrained('attempts')->cascadeOnDelete();
            $table->foreignUuid('question_id')->constrained('questions')->cascadeOnDelete();
            $table->text('jawaban')->nullable();
            $table->timestampsTz();
            $table->unique(['attempt_id', 'question_id']);
        });

        Schema::create('exam_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->foreignUuid('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignUuid('attempt_id')->nullable()->constrained('attempts')->nullOnDelete();
            $table->foreignUuid('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->string('type', 12);
            $table->text('message')->nullable();
            $table->timestampTz('created_at');
            $table->index(['teacher_id', 'created_at']);
        });

        Schema::create('videos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('judul', 200);
            $table->string('kreator', 150)->nullable();
            $table->string('durasi_text', 30)->nullable();
            $table->text('deskripsi')->nullable();
            $table->jsonb('software')->default('[]');
            $table->text('thumbnail_url')->nullable();
            $table->unsignedInteger('episode_no')->nullable();
            $table->string('kategori', 30)->default('showreel');
            $table->boolean('is_published')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestampsTz();
        });

        Schema::create('facilities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('judul', 200);
            $table->string('kategori', 30)->default('campus');
            $table->text('image_url')->nullable();
            $table->text('specs')->nullable();
            $table->text('deskripsi')->nullable();
            $table->jsonb('tags')->default('[]');
            $table->string('badge', 100)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });

        Schema::create('eskul', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nama', 150)->unique();
            $table->string('kategori', 100)->nullable();
            $table->text('image_url')->nullable();
            $table->string('warna', 20)->nullable();
            $table->string('warna_soft', 20)->nullable();
            $table->text('deskripsi')->nullable();
            $table->string('jadwal', 150)->nullable();
            $table->string('pembina', 150)->nullable();
            $table->text('prestasi')->nullable();
            $table->unsignedInteger('jumlah_anggota')->nullable();
            $table->unsignedInteger('max_anggota')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });

        Schema::create('gallery', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('judul', 200);
            $table->string('kategori', 100)->nullable();
            $table->date('tanggal')->nullable();
            $table->text('deskripsi')->nullable();
            $table->text('image_url')->nullable();
            $table->decimal('rotate', 6, 2)->default(0);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });

        Schema::create('ppdb_registrations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nama_lengkap', 150);
            $table->string('nisn', 20)->nullable();
            $table->string('asal_sekolah', 200)->nullable();
            $table->string('no_hp', 30)->nullable();
            $table->string('email', 150)->nullable();
            $table->foreignUuid('major_id')->nullable()->constrained('majors')->nullOnDelete();
            $table->string('status', 25)->default('baru');
            $table->timestampsTz();
            $table->index(['status', 'created_at']);
        });

        Schema::create('suggestions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nama', 150);
            $table->string('email', 150)->nullable();
            $table->string('no_hp', 30)->nullable();
            $table->string('kategori', 100)->nullable();
            $table->text('pesan');
            $table->string('status', 20)->default('baru');
            $table->timestampsTz();
        });

        Schema::create('site_visits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->timestampTz('visited_at')->useCurrent();
            $table->text('path')->nullable();
            $table->string('role', 10)->default('anon');
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('session_id', 100)->nullable();
            $table->string('user_agent', 300)->nullable();
            $table->index(['visited_at', 'role']);
            $table->index('session_id');
            $table->timestampsTz();
        });

        Schema::create('login_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->timestampTz('logged_in_at')->useCurrent();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('role', 10);
            $table->string('nama', 150)->nullable();
            $table->index(['logged_in_at', 'role']);
            $table->index('user_id');
            $table->timestampsTz();
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('CREATE UNIQUE INDEX user_sessions_active_unique ON user_sessions (user_id) WHERE revoked_at IS NULL');
            DB::statement("CREATE UNIQUE INDEX attempts_active_unique ON attempts (exam_id, student_id) WHERE status = 'berjalan'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'login_events', 'site_visits', 'suggestions', 'ppdb_registrations', 'gallery', 'eskul', 'facilities', 'videos',
            'exam_events', 'answers', 'attempts', 'exam_unlocks', 'exam_codes', 'questions', 'exams', 'attendance',
            'submissions', 'assignments', 'materials', 'schedules', 'subjects', 'students', 'classes', 'teachers',
            'majors', 'site_settings', 'user_sessions',
        ];

        foreach ($tables as $table) {
            Schema::dropIfExists($table);
        }
    }
};
