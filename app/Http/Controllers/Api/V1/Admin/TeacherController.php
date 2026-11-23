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
                $username = $this->resolveUsername($data['username'] ?? null, $data['nama']);
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
        $data = $request->validated();
        $createAccount = (bool) ($data['create_account'] ?? false);
        $initialPassword = null;

        if ($createAccount && $teacher->user_id) {
            return ApiResponse::error(
                'Guru ini sudah memiliki akun login.',
                [],
                409,
                'ACCOUNT_ALREADY_EXISTS',
            );
        }

        DB::transaction(function () use (&$initialPassword, $data, $createAccount, $teacher): void {
            if ($createAccount) {
                $username = $this->resolveUsername($data['username'] ?? null, $data['nama']);
                $initialPassword = $data['password'] ?? Str::password(12);

                $user = User::query()->create([
                    'name' => $data['nama'],
                    'username' => $username,
                    'email' => $data['email'] ?? null,
                    'password' => $initialPassword,
                    'role' => 'guru',
                ]);

                $teacher->user_id = $user->getKey();
            }

            $teacher->fill($this->profileData($data));
            $teacher->save();
        });

        return ApiResponse::success([
            'teacher' => $teacher->fresh(),
            'initial_password' => $initialPassword,
        ], $createAccount
            ? 'Data guru diperbarui dan akun login berhasil dibuat.'
            : 'Data guru berhasil diperbarui.');
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

    /**
     * Username yang dikirim admin dipakai apa adanya (huruf kecil, titik
     * dibiarkan); bila kosong, dibuat dari nama guru dan dijamin unik.
     */
    private function resolveUsername(?string $provided, string $nama): string
    {
        $username = Str::lower(trim((string) $provided));

        return $username !== '' ? $username : $this->uniqueUsername($nama);
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
