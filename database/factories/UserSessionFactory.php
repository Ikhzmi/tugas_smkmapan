<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<UserSession> */
class UserSessionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'device_id' => fake()->uuid(),
            'device_label' => 'Test Device',
            'last_seen_at' => now(),
        ];
    }
}
