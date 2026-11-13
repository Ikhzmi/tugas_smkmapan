<?php

namespace Database\Factories;

use App\Models\Exam;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Exam> */
class ExamFactory extends Factory
{
    public function definition(): array
    {
        return [
            'teacher_id' => Teacher::factory(),
            'subject_id' => Subject::factory(),
            'judul' => fake()->sentence(4),
            'durasi_menit' => 60,
            'is_active' => false,
            'acak_soal' => true,
        ];
    }
}
