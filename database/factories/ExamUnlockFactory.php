<?php

namespace Database\Factories;

use App\Models\Exam;
use App\Models\ExamUnlock;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ExamUnlock> */
class ExamUnlockFactory extends Factory
{
    public function definition(): array
    {
        return [
            'exam_id' => Exam::factory(),
            'student_id' => Student::factory(),
            'unlocked_at' => now(),
        ];
    }
}
