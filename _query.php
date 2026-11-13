<?php

require __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$student = App\Models\Student::query()->first();
echo 'student='.($student?->getKey() ?? 'null').PHP_EOL;

try {
    $query = App\Models\Exam::query()
        ->withCount('questions')
        ->where('is_active', true)
        ->with(['subject', 'attempts' => fn ($builder) => $builder->where('student_id', $student->getKey())])
        ->latest()
        ->paginate(20);
    echo 'ok total='.$query->total().PHP_EOL;
} catch (Throwable $error) {
    echo get_class($error).': '.$error->getMessage().PHP_EOL;
}
