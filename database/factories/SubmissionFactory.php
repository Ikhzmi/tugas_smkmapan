<?php

namespace Database\Factories;

use App\Models\Assignment;
use App\Models\Student;
use App\Models\Submission;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Submission> */
class SubmissionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'assignment_id' => Assignment::factory(),
            'student_id' => Student::factory(),
            'status' => 'dikumpulkan',
            'dikumpulkan_at' => now(),
        ];
    }
}
