<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\TeacherRequest;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class TeacherController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Teacher::query()->orderBy('sort_order')->orderBy('nama');
        $search = trim($request->string('q')->toString());

        if ($search !== '') {
            $query->where(function (Builder $builder) use ($search): void {
                $needle = '%'.mb_strtolower($search).'%';
                $builder->whereRaw('LOWER(nama) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(department) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$needle]);
            });
        }

        $teachers = $query->paginate(min(max($request->integer('per_page', 20), 1), 100));

        return ApiResponse::paginated($teachers);
    }

    public function store(TeacherRequest $request): JsonResponse
    {
        $data = $request->validated();
        $createAccount = (bool) ($data['create_account'] ?? false);
        $initialPassword = null;

        $teacher = DB::transaction(function () use (&$initialPassword, $data, $createAccount): Teacher {
            $userId = null;

            if ($createAccount) {
                $username = $data['username'] ?? Str::slug($data['nama']);
                $username = $this->uniqueUsername($username);
                $initialPassword = $data['password'] ?? Str::password(12);
                $user = User::query()->create([
                    'name' => $data['nama'],
                    'username' => $username,
                    'email' => $data['email'] ?? null,
                    'password' => $initialPassword,
                    'role' => 'guru',
                ]);
                $userId = $user->getKey();
            }

            return Teacher::query()->create([
                'user_id' => $userId,
                ...$this->profileData($data),
            ]);
        });

        return ApiResponse::created([
            'teacher' => $teacher,
            'initial_password' => $initialPassword,
        ], 'Data guru berhasil dibuat.');
    }

    public function update(TeacherRequest $request, Teacher $teacher): JsonResponse
    {
        $teacher->update($this->profileData($request->validated()));

        return ApiResponse::success($teacher->fresh(), 'Data guru berhasil diperbarui.');
    }

    public function destroy(Teacher $teacher): Response
    {
        DB::transaction(function () use ($teacher): void {
            if ($teacher->user_id) {
                $teacher->user?->tokens()->delete();
                $teacher->user?->delete();
            }
            $teacher->delete();
        });

        return response()->noContent();
    }

    /** @param array<string,mixed> $data @return array<string,mixed> */
    private function profileData(array $data): array
    {
        return array_intersect_key($data, array_flip(['nama', 'gelar', 'jabatan', 'department', 'email', 'jam_kerja', 'bio', 'sertifikasi', 'foto_url']));
    }

    private function uniqueUsername(string $base): string
    {
        $base = Str::lower(Str::slug($base, '-')) ?: 'guru';
        $username = $base;
        $counter = 1;

        while (User::query()->where('username', $username)->exists()) {
            $username = $base.'-'.$counter++;
        }

        return $username;
    }
}
