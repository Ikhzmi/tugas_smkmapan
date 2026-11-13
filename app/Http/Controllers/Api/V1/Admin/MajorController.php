<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Major;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MajorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Major::query()->orderBy('kode');

        if ($request->filled('q')) {
            $needle = '%'.mb_strtolower($request->string('q')->toString()).'%';
            $query->where(fn ($builder) => $builder->whereRaw('LOWER(kode) LIKE ?', [$needle])->orWhereRaw('LOWER(nama) LIKE ?', [$needle]));
        }

        return ApiResponse::paginated($query->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $major = Major::query()->create($request->validate($this->rules()));

        return ApiResponse::created($major, 'Jurusan berhasil dibuat.');
    }

    public function update(Request $request, Major $major): JsonResponse
    {
        $major->update($request->validate($this->rules(false, $major)));

        return ApiResponse::success($major->fresh(), 'Jurusan berhasil diperbarui.');
    }

    public function destroy(Major $major): Response
    {
        $major->delete();

        return response()->noContent();
    }

    /** @return array<string, list<string>|ValidationRule> */
    private function rules(bool $required = true, ?Major $major = null): array
    {
        $codeRule = ['string', 'max:20', 'unique:majors,kode'.($major ? ','.$major->getKey() : '')];

        return [
            'kode' => [$required ? 'required' : 'sometimes', ...$codeRule],
            'nama' => [$required ? 'required' : 'sometimes', 'string', 'max:150'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string', 'max:10000'],
            'biaya_pendaftaran' => ['sometimes', 'integer', 'min:0'],
            'spp_bulanan' => ['sometimes', 'integer', 'min:0'],
            'warna' => ['nullable', 'string', 'max:20'],
            'warna_soft' => ['nullable', 'string', 'max:20'],
            'ikon' => ['nullable', 'string', 'max:50'],
            'foto_url' => ['nullable', 'url', 'max:2048'],
            'kurikulum' => ['nullable', 'array'],
            'fasilitas' => ['nullable', 'array'],
            'karir' => ['nullable', 'array'],
            'sertifikasi' => ['nullable', 'array'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
