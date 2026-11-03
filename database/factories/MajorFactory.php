<?php

namespace Database\Factories;

use App\Models\Major;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Major> */
class MajorFactory extends Factory
{
    public function definition(): array
    {
        return [
            'kode' => fake()->unique()->lexify('???'),
            'nama' => fake()->company(),
            'is_active' => true,
        ];
    }
}
