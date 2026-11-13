<?php

namespace Database\Factories;

use App\Models\PpdbRegistration;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<PpdbRegistration> */
class PpdbRegistrationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nama_lengkap' => fake()->name(),
            'status' => 'baru',
        ];
    }
}
