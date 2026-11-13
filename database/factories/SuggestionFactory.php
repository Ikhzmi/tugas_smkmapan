<?php

namespace Database\Factories;

use App\Models\Suggestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Suggestion> */
class SuggestionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nama' => fake()->name(),
            'pesan' => fake()->sentence(),
            'status' => 'baru',
        ];
    }
}
