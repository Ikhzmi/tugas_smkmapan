<?php

namespace Database\Factories;

use App\Models\SchoolClass;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<SchoolClass> */
class SchoolClassFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nama' => fake()->bothify('X ??? #'),
            'tingkat' => 10,
            'tahun_ajaran' => '2026/2027',
            'major_id' => null,
            'wali_kelas_id' => null,
        ];
    }
}
