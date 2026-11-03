<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\CreateAccountRequest;
use App\Http\Requests\Api\V1\Admin\ResetPasswordRequest;
use App\Http\Requests\Api\V1\Admin\RoleUpdateRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class AccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->orderBy('name');
        $search = trim($request->string('q')->toString());

        if ($search !== '') {
            $query->where(function (Builder $builder) use ($search): void {
                $builder->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhere('username', 'like', '%'.$search.'%');
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->string('role')->toString());
        }

        $perPage = min(max($request->integer('per_page', 20), 1), 100);
        $users = $query->paginate($perPage)->through(fn (User $user): array => $this->row($user));

        return ApiResponse::paginated($users);
    }

    public function store(CreateAccountRequest $request): JsonResponse
    {
        $user = User::query()->create($request->validated());

        return ApiResponse::created($this->row($user), 'Akun berhasil dibuat.');
    }

    public function updateRole(RoleUpdateRequest $request, User $user): JsonResponse
    {
        if ($request->user()->is($user)) {
            return ApiResponse::error('Anda tidak boleh mengubah role akun sendiri.', [], 409, 'SELF_ROLE_CHANGE');
        }

        DB::transaction(function () use ($request, $user): void {
            $user->forceFill(['role' => $request->string('role')->toString()])->save();
            $user->tokens()->delete();
            $user->userSessions()->whereNull('revoked_at')->update(['revoked_at' => now()]);
        });

        return ApiResponse::success($this->row($user->fresh()), 'Role akun berhasil diubah.');
    }

    public function resetPassword(ResetPasswordRequest $request, User $user): JsonResponse
    {
        DB::transaction(function () use ($request, $user): void {
            $user->forceFill(['password' => $request->string('password')->toString()])->save();
            $user->tokens()->delete();
            $user->userSessions()->whereNull('revoked_at')->update(['revoked_at' => now()]);
        });

        return ApiResponse::success(null, 'Kata sandi berhasil direset.');
    }

    public function destroy(Request $request, User $user): Response|JsonResponse
    {
        if ($request->user()->is($user)) {
            return ApiResponse::error('Anda tidak boleh menghapus akun sendiri.', [], 409, 'SELF_DELETE');
        }

        DB::transaction(function () use ($user): void {
            $user->tokens()->delete();
            $user->delete();
        });

        return response()->noContent();
    }

    /** @return array<string,mixed> */
    private function row(User $user): array
    {
        return [
            'user_id' => $user->getKey(),
            'name' => $user->name,
            'nama' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => $user->is_active,
            'last_login_at' => $user->last_login_at?->toISOString(),
        ];
    }
}
