<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Student> */
class StudentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'nisn' => fake()->unique()->numerify('##########'),
            'nama' => fake()->name(),
            'class_id' => null,
        ];
    }
}
