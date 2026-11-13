<?php

namespace Database\Factories;

use App\Models\Exam;
use App\Models\ExamEvent;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ExamEvent> */
class ExamEventFactory extends Factory
{
    public function definition(): array
    {
        return [
            'exam_id' => Exam::factory(),
            'type' => 'warning',
            'message' => fake()->sentence(),
            'created_at' => now(),
        ];
    }
}
