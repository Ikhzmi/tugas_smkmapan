<?php

namespace App\Http\Controllers\Api\V1;

use App\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Public\PpdbRegistrationRequest;
use App\Http\Requests\Api\V1\Public\SiteVisitRequest;
use App\Http\Requests\Api\V1\Public\SuggestionRequest;
use App\Models\Eskul;
use App\Models\Facility;
use App\Models\Gallery;
use App\Models\Major;
use App\Models\PpdbRegistration;
use App\Models\SiteSetting;
use App\Models\SiteVisit;
use App\Models\Suggestion;
use App\Models\Teacher;
use App\Models\Video;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    public function site(): JsonResponse
    {
        return ApiResponse::success(SiteSetting::query()->pluck('value', 'key')->all());
    }

    public function majors(Request $request): JsonResponse
    {
        return $this->list($request, Major::query()->where('is_active', true)->orderBy('kode'));
    }

    public function teachers(Request $request): JsonResponse
    {
        $query = Teacher::query()->where('is_active', true)->orderBy('sort_order')->orderBy('nama');

        return $this->list($request, $query, static fn (Teacher $teacher): array => [
            'id' => $teacher->getKey(),
            'nama' => $teacher->nama,
            'gelar' => $teacher->gelar,
            'jabatan' => $teacher->jabatan,
            'department' => $teacher->department,
            'email' => $teacher->email,
            'jam_kerja' => $teacher->jam_kerja,
            'bio' => $teacher->bio,
            'sertifikasi' => $teacher->sertifikasi,
            'foto_url' => $teacher->foto_url,
        ]);
    }

    public function facilities(Request $request): JsonResponse
    {
        return $this->list($request, Facility::query()->where('is_active', true)->orderBy('sort_order'));
    }

    public function eskul(Request $request): JsonResponse
    {
        return $this->list($request, Eskul::query()->where('is_active', true)->orderBy('nama'));
    }

    public function gallery(Request $request): JsonResponse
    {
        return $this->list($request, Gallery::query()->where('is_active', true)->orderBy('sort_order'));
    }

    public function videos(Request $request): JsonResponse
    {
        $query = Video::query()->where('is_published', true)->orderBy('sort_order');

        if ($request->filled('category')) {
            $query->where('kategori', $request->string('category')->toString());
        }

        return $this->list($request, $query);
    }

    public function storePpdb(PpdbRegistrationRequest $request): JsonResponse
    {
        $data = $this->clean($request->validated());
        $registration = PpdbRegistration::query()->create($data);

        return ApiResponse::created(['id' => $registration->getKey(), 'status' => $registration->fresh()->status], 'Pendaftaran berhasil dikirim.');
    }

    public function storeSuggestion(SuggestionRequest $request): JsonResponse
    {
        $suggestion = Suggestion::query()->create($this->clean($request->validated()));

        return ApiResponse::created(['id' => $suggestion->getKey(), 'status' => $suggestion->fresh()->status], 'Saran berhasil dikirim.');
    }

    public function storeVisit(SiteVisitRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();
        SiteVisit::query()->create([
            'path' => isset($data['path']) ? strip_tags($data['path']) : null,
            'role' => $user?->role ?? 'anon',
            'user_id' => $user?->getAuthIdentifier(),
            'session_id' => $data['session_id'] ?? null,
            'user_agent' => substr($data['user_agent'] ?? $request->userAgent() ?? '', 0, 300),
        ]);

        return ApiResponse::success(null, 'Kunjungan dicatat.');
    }

    /** @param \Closure(object):array<string,mixed>|null $transform */
    private function list(Request $request, Builder $query, ?\Closure $transform = null): JsonResponse
    {
        $perPage = min(max($request->integer('per_page', 50), 1), 100);
        $paginator = $query->paginate($perPage);

        if ($transform) {
            $paginator->through($transform);
        }

        return ApiResponse::paginated($paginator);
    }

    /** @param array<string,mixed> $data @return array<string,mixed> */
    private function clean(array $data): array
    {
        return array_map(static function (mixed $value): mixed {
            return is_string($value) ? strip_tags($value) : $value;
        }, $data);
    }
}
