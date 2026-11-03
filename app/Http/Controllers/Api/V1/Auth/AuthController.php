<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\ChangePasswordRequest;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\ProfileUpdateRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function login(LoginRequest $request, AuthService $auth): JsonResponse
    {
        $result = $auth->login(
            $request->string('identifier')->toString(),
            $request->string('password')->toString(),
            $request->input('device_id'),
            $request->input('device_label'),
        );

        if ($result['status'] !== 200) {
            return response()->json([
                'message' => $result['message'],
                'errors' => $result['errors'] ?? [],
                'code' => $result['code'] ?? null,
                ...array_filter([
                    'other_device_label' => $result['other_device_label'] ?? null,
                    'other_last_seen' => $result['other_last_seen'] ?? null,
                ], static fn (mixed $value): bool => $value !== null),
            ], $result['status']);
        }

        return ApiResponse::success($result['data'], $result['message']);
    }

    public function logout(Request $request, AuthService $auth): Response
    {
        $auth->logout($request->user(), PersonalAccessToken::findToken((string) $request->bearerToken()));

        return response()->noContent();
    }

    public function me(Request $request, AuthService $auth): JsonResponse
    {
        return ApiResponse::success($auth->userPayload($request->user()));
    }

    public function updateProfile(ProfileUpdateRequest $request, AuthService $auth): JsonResponse
    {
        $user = $request->user();
        $user->forceFill($request->validated())->save();

        return ApiResponse::success($auth->userPayload($user->fresh()), 'Profil diperbarui.');
    }

    public function changePassword(ChangePasswordRequest $request, AuthService $auth): Response
    {
        $user = $request->user();

        if (! Hash::check($request->string('current_password')->toString(), $user->password)) {
            return ApiResponse::error('Kata sandi saat ini salah.', [
                'current_password' => ['Kata sandi saat ini salah.'],
            ], 422, 'INVALID_CURRENT_PASSWORD');
        }

        $auth->changePassword($user, $request->string('password')->toString());

        return response()->noContent();
    }

    public function claimSession(Request $request, AuthService $auth): JsonResponse
    {
        $validated = $request->validate([
            'device_id' => ['required', 'string', 'max:100'],
            'device_label' => ['required', 'string', 'max:100'],
            'grace_minutes' => ['sometimes', 'integer', 'min:1', 'max:30'],
        ]);
        $result = $auth->claim($request->user(), $validated['device_id'], $validated['device_label'], $validated['grace_minutes'] ?? 5);

        if ($result['status'] === 'conflict') {
            return response()->json([
                'message' => 'Akun sedang aktif di perangkat lain.',
                'errors' => ['session' => ['Perangkat lama masih aktif.']],
                'code' => 'SESSION_CONFLICT',
                'other_device_label' => $result['other_device_label'] ?? null,
                'other_last_seen' => $result['other_last_seen'] ?? null,
            ], 409);
        }

        return ApiResponse::success($this->sessionPayload($result['session'] ?? null), 'Sesi aktif.');
    }

    public function resumeSession(Request $request, AuthService $auth): JsonResponse
    {
        $validated = $request->validate([
            'device_id' => ['required', 'string', 'max:100'],
            'grace_minutes' => ['sometimes', 'integer', 'min:1', 'max:30'],
        ]);
        $result = $auth->resume($request->user(), $validated['device_id'], $validated['grace_minutes'] ?? 5);

        return ApiResponse::success($result);
    }

    public function heartbeat(Request $request, AuthService $auth): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => ['required', 'uuid'],
        ]);

        return ApiResponse::success($auth->heartbeat($request->user(), $validated['session_id']));
    }

    public function releaseSession(Request $request, AuthService $auth): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => ['required', 'uuid'],
        ]);
        $auth->release($request->user(), $validated['session_id']);

        return ApiResponse::success(['released' => true]);
    }

    public function sessionStatus(Request $request): JsonResponse
    {
        $deviceId = $request->string('device_id')->toString();

        if ($request->user()->role === 'admin' || $deviceId === '') {
            return ApiResponse::success(['active' => false, 'session' => null]);
        }

        $session = $request->user()->userSessions()
            ->where('device_id', $deviceId)
            ->whereNull('revoked_at')
            ->latest('last_seen_at')
            ->first();

        return ApiResponse::success([
            'active' => (bool) $session,
            'session' => $this->sessionPayload($session),
        ]);
    }

    /** @return array<string,mixed>|null */
    private function sessionPayload(?object $session): ?array
    {
        if (! $session) {
            return null;
        }

        return [
            'id' => $session->getKey(),
            'device_id' => $session->device_id,
            'device_label' => $session->device_label,
            'last_seen_at' => $session->last_seen_at?->toISOString(),
        ];
    }
}
