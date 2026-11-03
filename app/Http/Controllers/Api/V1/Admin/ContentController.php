<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Facility;
use App\Models\LoginEvent;
use App\Models\PpdbRegistration;
use App\Models\SiteSetting;
use App\Models\SiteVisit;
use App\Models\Suggestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
        $visits = SiteVisit::query()->where('visited_at', '>=', $since)->get();
        $logins = LoginEvent::query()->where('logged_in_at', '>=', $since)->get();

        return ApiResponse::success([
            'range_days' => $range,
            'visits_total' => $visits->count(),
            'logins_total' => $logins->count(),
            'visits_by_day' => $visits->groupBy(fn (SiteVisit $visit): string => $visit->visited_at->toDateString())->map->count(),
            'logins_by_day' => $logins->groupBy(fn (LoginEvent $event): string => $event->logged_in_at->toDateString())->map->count(),
            'visits_by_role' => $visits->groupBy('role')->map->count(),
            'logins_by_role' => $logins->groupBy('role')->map->count(),
            'latest_logins' => $logins->sortByDesc('logged_in_at')->take(20)->values(),
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
}
