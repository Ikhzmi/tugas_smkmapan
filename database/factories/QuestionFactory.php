<?php

namespace Database\Factories;

use App\Models\Exam;
use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Question> */
class QuestionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'exam_id' => Exam::factory(),
            'tipe' => 'pg',
            'pertanyaan' => fake()->sentence(),
            'opsi' => ['A' => 'A', 'B' => 'B', 'C' => 'C', 'D' => 'D'],
            'kunci_jawaban' => 'A',
            'bobot' => 1,
        ];
    }
}
