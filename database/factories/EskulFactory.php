<?php

namespace Database\Factories;

use App\Models\Eskul;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Eskul> */
class EskulFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nama' => fake()->unique()->sentence(2),
            'is_active' => true,
        ];
    }
}
