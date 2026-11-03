<?php

namespace Database\Factories;

use App\Models\Exam;
use App\Models\ExamCode;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ExamCode> */
class ExamCodeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'exam_id' => Exam::factory(),
            'code' => 'SMK268',
            'is_active' => true,
        ];
    }
}
