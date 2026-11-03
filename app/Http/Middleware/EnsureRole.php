<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles, true)) {
            return response()->json([
                'message' => 'Akses ditolak.',
                'errors' => [
                    'role' => ['Peran Anda tidak memiliki akses ke resource ini.'],
                ],
                'code' => 'FORBIDDEN_ROLE',
            ], 403);
        }

        if (! in_array($user->role, UserRole::values(), true)) {
            return response()->json([
                'message' => 'Akun memiliki peran yang tidak valid.',
                'errors' => [],
                'code' => 'INVALID_ROLE',
            ], 403);
        }

        return $next($request);
    }
}
