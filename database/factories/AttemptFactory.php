<?php

namespace Database\Factories;

use App\Models\Attempt;
use App\Models\Exam;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Attempt> */
class AttemptFactory extends Factory
{
    public function definition(): array
    {
        return [
            'exam_id' => Exam::factory(),
            'student_id' => Student::factory(),
            'status' => 'berjalan',
            'dimulai_at' => now(),
            'question_order' => [],
        ];
    }
}
