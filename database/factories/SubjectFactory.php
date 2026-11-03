<?php

namespace Database\Factories;

use App\Models\Subject;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Subject> */
class SubjectFactory extends Factory
{
    public function definition(): array
    {
        return [
            'kode' => fake()->unique()->lexify('SUB-??'),
            'nama' => fake()->sentence(2),
            'major_id' => null,
        ];
    }
}
