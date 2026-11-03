<?php

namespace Database\Factories;

use App\Models\LoginEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<LoginEvent> */
class LoginEventFactory extends Factory
{
    public function definition(): array
    {
        return [
            'logged_in_at' => now(),
            'user_id' => User::factory(),
            'role' => 'siswa',
            'nama' => fake()->name(),
        ];
    }
}
