<?php

namespace Database\Factories;

use App\Models\SiteVisit;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<SiteVisit> */
class SiteVisitFactory extends Factory
{
    public function definition(): array
    {
        return [
            'visited_at' => now(),
            'path' => '/',
            'role' => 'anon',
            'user_id' => null,
            'session_id' => fake()->uuid(),
        ];
    }
}
