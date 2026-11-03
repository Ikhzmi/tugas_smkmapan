<?php

namespace Database\Factories;

use App\Models\Material;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Material> */
class MaterialFactory extends Factory
{
    public function definition(): array
    {
        return [
            'teacher_id' => Teacher::factory(),
            'subject_id' => Subject::factory(),
            'class_id' => SchoolClass::factory(),
            'judul' => fake()->sentence(4),
            'tipe' => 'teks',
            'is_published' => false,
        ];
    }
}
