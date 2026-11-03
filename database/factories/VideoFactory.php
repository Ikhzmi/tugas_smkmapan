<?php

namespace Database\Factories;

use App\Models\Video;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Video> */
class VideoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'judul' => fake()->sentence(4),
            'kategori' => 'showreel',
            'is_published' => false,
        ];
    }
}
