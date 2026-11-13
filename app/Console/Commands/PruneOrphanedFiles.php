<?php

namespace App\Console\Commands;

use App\Models\Facility;
use App\Models\Gallery;
use App\Models\Major;
use App\Models\Material;
use App\Models\Question;
use App\Models\SiteSetting;
use App\Models\Submission;
use App\Models\Teacher;
use App\Models\User;
use App\Models\Video;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class PruneOrphanedFiles extends Command
{
    protected $signature = 'storage:prune-orphans {--disk=public : Nama disk pada config/filesystems.php} {--delete : Hapus file orphan setelah daftar kandidat ditampilkan}';

    protected $description = 'Find orphaned Laravel Storage files without deleting them unless --delete is supplied.';

    public function handle(): int
    {
        $disk = (string) $this->option('disk');

        if (! array_key_exists($disk, (array) config('filesystems.disks'))) {
            $this->error('Disk tidak terdaftar di config/filesystems.php: '.$disk);

            return self::INVALID;
        }

        $storage = Storage::disk($disk);
        $referenced = $this->referencedPaths($disk);
        $orphans = collect($storage->allFiles())
            ->filter(fn (string $path): bool => ! in_array($path, ['.gitignore', ''], true))
            ->reject(fn (string $path): bool => $referenced->contains($this->normalize($path)))
            ->values();

        $this->info(sprintf('Disk %s: %d file orphan ditemukan.', $disk, $orphans->count()));

        if ($orphans->isEmpty()) {
            return self::SUCCESS;
        }

        $orphans->each(fn (string $path): mixed => $this->line(' - '.$path));

        if (! $this->option('delete')) {
            $this->comment('Dry-run: tidak ada file dihapus. Jalankan ulang dengan --delete setelah memeriksa daftar.');

            return self::SUCCESS;
        }

        $deleted = $orphans->filter(fn (string $path): bool => $storage->delete($path))->count();
        $this->warn(sprintf('%d file orphan dihapus dari disk %s.', $deleted, $disk));

        return self::SUCCESS;
    }

    /** @return Collection<int, string> */
    private function referencedPaths(string $disk): Collection
    {
        $privateDisks = ['local', (string) config('filesystems.private_disk', 'local')];

        if (in_array($disk, $privateDisks, true)) {
            return Submission::query()->whereNotNull('file_path')->pluck('file_path')->map(fn (string $path): string => $this->normalize($path));
        }

        $values = collect();
        foreach ([
            Major::class => ['foto_url'],
            Teacher::class => ['foto_url'],
            User::class => ['foto_url'],
            Material::class => ['file_url'],
            Question::class => ['gambar_url'],
            Video::class => ['thumbnail_url'],
            Facility::class => ['image_url'],
            Gallery::class => ['image_url'],
        ] as $model => $columns) {
            foreach ($columns as $column) {
                $values = $values->merge($model::query()->whereNotNull($column)->pluck($column));
            }
        }

        $values = $values->merge(SiteSetting::query()->get()->flatMap(fn (SiteSetting $setting): array => $this->flattenValue($setting->value)));

        return $values
            ->flatMap(fn (mixed $value): array => $this->extractPaths((string) $value))
            ->map(fn (string $path): string => $this->normalize($path))
            ->filter()
            ->unique()
            ->values();
    }

    /** @return list<string> */
    private function extractPaths(string $value): array
    {
        $paths = [$value];
        $parsed = parse_url($value, PHP_URL_PATH);

        if (is_string($parsed) && $parsed !== '') {
            $paths[] = $parsed;
        }

        return $paths;
    }

    private function normalize(string $path): string
    {
        $path = trim(str_replace('\\', '/', $path));
        $path = ltrim($path, '/');

        if (str_starts_with($path, 'storage/')) {
            $path = substr($path, strlen('storage/'));
        }

        // Supabase: /storage/v1/object/public/{bucket}/path dan varian signed.
        $path = preg_replace('#^storage/v1/object/(?:public|sign|authenticated)/[^/]+/#', '', $path) ?? $path;

        return $path;
    }

    /** @return list<string> */
    private function flattenValue(mixed $value): array
    {
        if (is_string($value)) {
            return [$value];
        }

        if (! is_array($value)) {
            return [];
        }

        return collect($value)->flatMap(fn (mixed $item): array => $this->flattenValue($item))->all();
    }
}
