<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Eskul;
use App\Models\Facility;
use App\Models\Gallery;
use App\Models\LoginEvent;
use App\Models\PpdbRegistration;
use App\Models\SiteSetting;
use App\Models\Suggestion;
use App\Models\Video;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ContentController extends Controller
{
    public function settings(): JsonResponse
    {
        return ApiResponse::success(SiteSetting::query()->pluck('value', 'key')->all());
    }

    public function updateSetting(Request $request, string $key): JsonResponse
    {
        $data = $request->validate(['value' => ['required', 'array']]);
        $setting = SiteSetting::query()->updateOrCreate(['key' => $key], ['value' => $data['value']]);

        return ApiResponse::success($setting, 'Pengaturan berhasil disimpan.');
    }

    public function analytics(Request $request): JsonResponse
    {
        $range = $request->integer('range', 7);
        if (! in_array($range, [7, 30, 90], true)) {
            $range = 7;
        }
        $since = now()->subDays($range - 1)->startOfDay();
        $visits = DB::table('site_visits')->where('visited_at', '>=', $since);
        $logins = DB::table('login_events')->where('logged_in_at', '>=', $since);

        return ApiResponse::success([
            'range_days' => $range,
            'visits_total' => (clone $visits)->count(),
            'logins_total' => (clone $logins)->count(),
            'visits_by_day' => $this->dailyCounts(clone $visits, 'visited_at'),
            'logins_by_day' => $this->dailyCounts(clone $logins, 'logged_in_at'),
            'visits_by_role' => $this->roleCounts(clone $visits),
            'logins_by_role' => $this->roleCounts(clone $logins),
            'latest_logins' => LoginEvent::query()
                ->where('logged_in_at', '>=', $since)
                ->latest('logged_in_at')
                ->limit(20)
                ->get(),
        ]);
    }

    public function ppdb(Request $request): JsonResponse
    {
        $query = PpdbRegistration::query()->latest();
        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return ApiResponse::paginated($query->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function updatePpdb(Request $request, PpdbRegistration $registration): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'in:baru,menunggu_verifikasi,diterima,ditolak']]);
        $registration->update($data);

        return ApiResponse::success($registration->fresh(), 'Status PPDB diperbarui.');
    }

    public function destroyPpdb(PpdbRegistration $registration): Response
    {
        $registration->delete();

        return response()->noContent();
    }

    public function suggestions(Request $request): JsonResponse
    {
        return ApiResponse::paginated(Suggestion::query()->latest()->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function destroySuggestion(Suggestion $suggestion): Response
    {
        $suggestion->delete();

        return response()->noContent();
    }

    public function facilities(Request $request): JsonResponse
    {
        return ApiResponse::paginated(Facility::query()->orderBy('sort_order')->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function storeFacility(Request $request): JsonResponse
    {
        return ApiResponse::created(Facility::query()->create($request->validate($this->facilityRules())), 'Fasilitas berhasil dibuat.');
    }

    public function updateFacility(Request $request, Facility $facility): JsonResponse
    {
        $facility->update($request->validate($this->facilityRules(false)));

        return ApiResponse::success($facility->fresh(), 'Fasilitas berhasil diperbarui.');
    }

    public function destroyFacility(Facility $facility): Response
    {
        $facility->delete();

        return response()->noContent();
    }

    public function eskul(Request $request): JsonResponse
    {
        return ApiResponse::paginated(Eskul::query()->orderBy('nama')->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function storeEskul(Request $request): JsonResponse
    {
        return ApiResponse::created(Eskul::query()->create($request->validate($this->eskulRules())), 'Ekstrakurikuler berhasil dibuat.');
    }

    public function updateEskul(Request $request, Eskul $eskul): JsonResponse
    {
        $eskul->update($request->validate($this->eskulRules(false)));

        return ApiResponse::success($eskul->fresh(), 'Ekstrakurikuler berhasil diperbarui.');
    }

    public function destroyEskul(Eskul $eskul): Response
    {
        $eskul->delete();

        return response()->noContent();
    }

    public function gallery(Request $request): JsonResponse
    {
        return ApiResponse::paginated(Gallery::query()->orderBy('sort_order')->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function storeGallery(Request $request): JsonResponse
    {
        return ApiResponse::created(Gallery::query()->create($request->validate($this->galleryRules())), 'Galeri berhasil dibuat.');
    }

    public function updateGallery(Request $request, Gallery $gallery): JsonResponse
    {
        $gallery->update($request->validate($this->galleryRules(false)));

        return ApiResponse::success($gallery->fresh(), 'Galeri berhasil diperbarui.');
    }

    public function destroyGallery(Gallery $gallery): Response
    {
        $gallery->delete();

        return response()->noContent();
    }

    public function videos(Request $request): JsonResponse
    {
        return ApiResponse::paginated(Video::query()->orderBy('sort_order')->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function storeVideo(Request $request): JsonResponse
    {
        return ApiResponse::created(Video::query()->create($request->validate($this->videoRules())), 'Video berhasil dibuat.');
    }

    public function updateVideo(Request $request, Video $video): JsonResponse
    {
        $video->update($request->validate($this->videoRules(false)));

        return ApiResponse::success($video->fresh(), 'Video berhasil diperbarui.');
    }

    public function destroyVideo(Video $video): Response
    {
        $video->delete();

        return response()->noContent();
    }

    public function upload(Request $request, string $context): JsonResponse
    {
        $folders = $this->uploadFolders();

        if (! isset($folders[$context])) {
            return ApiResponse::error('Konteks upload tidak valid.', [], 422, 'UPLOAD_CONTEXT_INVALID');
        }

        $request->validate(['file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120']]);
        $disk = (string) config('filesystems.media_disk', 'public');
        $path = $request->file('file')->store($folders[$context], $disk);

        return ApiResponse::created(['url' => Storage::disk($disk)->url($path), 'path' => $path], 'Berkas berhasil diunggah.');
    }

    public function presignUpload(Request $request, string $context): JsonResponse
    {
        $folders = $this->uploadFolders();

        if (! isset($folders[$context])) {
            return ApiResponse::error('Konteks upload tidak valid.', [], 422, 'UPLOAD_CONTEXT_INVALID');
        }

        $data = $request->validate([
            'filename' => ['required', 'string', 'max:255'],
            'content_type' => ['required', 'string', 'in:image/jpeg,image/png,image/webp,image/gif'],
            'size' => ['required', 'integer', 'min:1', 'max:5242880'],
        ]);

        $diskName = (string) config('filesystems.media_disk', 'public');
        $disk = Storage::disk($diskName);

        if ((string) config("filesystems.disks.{$diskName}.driver") !== 's3') {
            return ApiResponse::error('Direct upload memerlukan disk cloud. Gunakan unggah multipart.', [], 422, 'DIRECT_UPLOAD_UNSUPPORTED');
        }

        $extension = match ($data['content_type']) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
        };
        $path = $folders[$context].'/'.Str::uuid().'.'.$extension;
        $expiresAt = now()->addMinutes(15);
        $url = $disk->temporaryUploadUrl($path, $expiresAt, ['ContentType' => $data['content_type']]);

        return ApiResponse::created([
            'upload_url' => $url,
            'method' => 'PUT',
            'path' => $path,
            'url' => $disk->url($path),
            'headers' => ['Content-Type' => $data['content_type']],
            'expires_at' => $expiresAt->toISOString(),
        ], 'URL unggah berkas dibuat.');
    }

    /** @return array<string, int> */
    private function dailyCounts(Builder $query, string $column): array
    {
        $postgres = $query->getConnection()->getDriverName() === 'pgsql';
        $dateExpression = $postgres ? "DATE({$column} AT TIME ZONE ?)" : "DATE({$column})";
        $bindings = $postgres ? [config('app.timezone', 'UTC')] : [];

        return $query
            ->selectRaw("{$dateExpression} as day, COUNT(*) as aggregate", $bindings)
            ->groupByRaw($dateExpression, $bindings)
            ->orderBy('day')
            ->get()
            ->mapWithKeys(fn (object $row): array => [(string) $row->day => (int) $row->aggregate])
            ->all();
    }

    /** @return array<string, int> */
    private function roleCounts(Builder $query): array
    {
        return $query
            ->selectRaw('role, COUNT(*) as aggregate')
            ->groupBy('role')
            ->get()
            ->mapWithKeys(fn (object $row): array => [(string) $row->role => (int) $row->aggregate])
            ->all();
    }

    /** @return array<string, string> */
    private function uploadFolders(): array
    {
        return [
            'major' => 'branding/jurusan', 'hero' => 'branding/hero', 'profile' => 'branding/profile',
            'teacher-photo' => 'teachers', 'eskul' => 'eskul', 'facility' => 'fasilitas', 'gallery' => 'galeri',
        ];
    }

    /** @return array<string, list<string>> */
    private function facilityRules(bool $required = true): array
    {
        return [
            'judul' => [$required ? 'required' : 'sometimes', 'string', 'max:200'],
            'kategori' => ['nullable', 'string', 'max:30'],
            'image_url' => ['nullable', 'url', 'max:2048'],
            'specs' => ['nullable', 'string', 'max:2000'],
            'deskripsi' => ['nullable', 'string', 'max:5000'],
            'tags' => ['nullable', 'array'],
            'badge' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /** @return array<string, list<string>> */
    private function eskulRules(bool $required = true): array
    {
        return [
            'nama' => [$required ? 'required' : 'sometimes', 'string', 'max:150'],
            'kategori' => ['nullable', 'string', 'max:100'], 'image_url' => ['nullable', 'url', 'max:2048'],
            'warna' => ['nullable', 'string', 'max:20'], 'warna_soft' => ['nullable', 'string', 'max:20'],
            'deskripsi' => ['nullable', 'string', 'max:5000'], 'jadwal' => ['nullable', 'string', 'max:150'],
            'pembina' => ['nullable', 'string', 'max:150'], 'prestasi' => ['nullable', 'string', 'max:5000'],
            'jumlah_anggota' => ['nullable', 'integer', 'min:0'], 'max_anggota' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /** @return array<string, list<string>> */
    private function galleryRules(bool $required = true): array
    {
        return [
            'judul' => [$required ? 'required' : 'sometimes', 'string', 'max:200'], 'kategori' => ['nullable', 'string', 'max:100'],
            'tanggal' => ['nullable', 'date'], 'deskripsi' => ['nullable', 'string', 'max:5000'],
            'image_url' => ['nullable', 'url', 'max:2048'], 'rotate' => ['sometimes', 'numeric'],
            'sort_order' => ['sometimes', 'integer', 'min:0'], 'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /** @return array<string, list<string>> */
    private function videoRules(bool $required = true): array
    {
        return [
            'judul' => [$required ? 'required' : 'sometimes', 'string', 'max:200'], 'kreator' => ['nullable', 'string', 'max:150'],
            'durasi_text' => ['nullable', 'string', 'max:30'], 'deskripsi' => ['nullable', 'string', 'max:5000'],
            'software' => ['nullable', 'array'], 'thumbnail_url' => ['nullable', 'url', 'max:2048'],
            'episode_no' => ['nullable', 'integer', 'min:0'], 'kategori' => ['nullable', 'string', 'max:30'],
            'is_published' => ['sometimes', 'boolean'], 'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
