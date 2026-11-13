<?php

namespace App\Services;

use App\Models\LoginEvent;
use App\Models\Student;
use App\Models\User;
use App\Models\UserSession;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class AuthService
{
    /**
     * @return array{status:int, data?:array<string,mixed>, message?:string, errors?:array<string,list<string>>, code?:string}
     */
    public function login(string $identifier, string $password, ?string $deviceId, ?string $deviceLabel): array
    {
        $user = $this->resolveUser($identifier);

        if (! $user || ! Hash::check($password, $user->password)) {
            return [
                'status' => 401,
                'message' => 'Identifier atau kata sandi salah.',
                'errors' => [],
                'code' => 'INVALID_CREDENTIALS',
            ];
        }

        if (! $user->is_active) {
            $user->tokens()->delete();

            return [
                'status' => 403,
                'message' => 'Akun tidak aktif.',
                'errors' => [],
                'code' => 'ACCOUNT_INACTIVE',
            ];
        }

        $deviceId ??= 'api-'.bin2hex(random_bytes(16));
        $deviceLabel = $deviceLabel ?: 'Perangkat API';

        return DB::transaction(function () use ($user, $deviceId, $deviceLabel): array {
            $now = now();
            $session = null;

            if ($user->role !== 'admin') {
                $session = UserSession::query()
                    ->where('user_id', $user->getKey())
                    ->whereNull('revoked_at')
                    ->latest('last_seen_at')
                    ->first();

                if ($session && $session->device_id !== $deviceId && $session->last_seen_at->greaterThan($now->copy()->subMinutes(5))) {
                    return [
                        'status' => 409,
                        'message' => 'Akun sedang aktif di perangkat lain.',
                        'errors' => [
                            'session' => [sprintf('%s, terakhir aktif %s.', $session->device_label ?: 'Perangkat lain', $session->last_seen_at->diffForHumans($now))],
                        ],
                        'code' => 'SESSION_CONFLICT',
                        'other_device_label' => $session->device_label,
                        'other_last_seen' => $session->last_seen_at->toISOString(),
                    ];
                }

                if ($session) {
                    $this->revokeSession($session, $now);
                }
            }

            $token = $user->createToken(
                'api',
                ['*'],
                $now->copy()->addMinutes((int) (config('sanctum.expiration') ?: 43200)),
            );

            if ($user->role !== 'admin') {
                $session = UserSession::query()->create([
                    'user_id' => $user->getKey(),
                    'personal_access_token_id' => $token->accessToken->getKey(),
                    'device_id' => $deviceId,
                    'device_label' => $deviceLabel,
                    'last_seen_at' => $now,
                ]);
            }

            $user->forceFill(['last_login_at' => $now])->save();
            LoginEvent::query()->create([
                'user_id' => $user->getKey(),
                'role' => $user->role,
                'nama' => $user->name,
                'logged_in_at' => $now,
            ]);

            return [
                'status' => 200,
                'data' => [
                    'token' => $token->plainTextToken,
                    'token_type' => 'Bearer',
                    'expires_at' => $token->accessToken->expires_at?->toISOString(),
                    'user' => $this->userPayload($user),
                    'session' => $session ? [
                        'id' => $session->getKey(),
                        'device_id' => $session->device_id,
                        'device_label' => $session->device_label,
                        'last_seen_at' => $session->last_seen_at->toISOString(),
                    ] : null,
                ],
                'message' => 'Login berhasil.',
            ];
        });
    }

    public function logout(User $user, ?PersonalAccessToken $token): void
    {
        if (! $token) {
            return;
        }

        UserSession::query()
            ->where('user_id', $user->getKey())
            ->where('personal_access_token_id', $token->getKey())
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
        $token->delete();
    }

    public function changePassword(User $user, string $password): void
    {
        DB::transaction(function () use ($user, $password): void {
            $now = now();
            $user->forceFill(['password' => $password])->save();
            $user->tokens()->delete();
            $user->userSessions()->whereNull('revoked_at')->update(['revoked_at' => $now]);
        });
    }

    /** @return array<string,mixed> */
    public function userPayload(User $user): array
    {
        $user->loadMissing(['teacher', 'student']);

        return [
            'id' => $user->getKey(),
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role,
            'foto_url' => $user->foto_url,
            'teacher_id' => $user->teacher?->getKey(),
            'student_id' => $user->student?->getKey(),
        ];
    }

    /** @return array<string,mixed> */
    public function claim(User $user, string $deviceId, string $deviceLabel, int $graceMinutes = 5): array
    {
        if ($user->role === 'admin') {
            return ['status' => 'ok', 'session' => null];
        }

        $now = now();
        $session = UserSession::query()->where('user_id', $user->getKey())->whereNull('revoked_at')->latest('last_seen_at')->first();

        if ($session && $session->device_id !== $deviceId && $session->last_seen_at->greaterThan($now->copy()->subMinutes($graceMinutes))) {
            return [
                'status' => 'conflict',
                'other_device_label' => $session->device_label,
                'other_last_seen' => $session->last_seen_at->toISOString(),
            ];
        }

        if ($session && $session->device_id !== $deviceId) {
            $this->revokeSession($session, $now);
        }

        $session ??= UserSession::query()->create([
            'user_id' => $user->getKey(),
            'device_id' => $deviceId,
            'device_label' => $deviceLabel,
            'last_seen_at' => $now,
        ]);
        $session->update(['device_id' => $deviceId, 'device_label' => $deviceLabel, 'last_seen_at' => $now]);

        return ['status' => 'ok', 'session' => $session->fresh()];
    }

    /** @return array<string,mixed> */
    public function resume(User $user, string $deviceId, int $graceMinutes = 5): array
    {
        $session = UserSession::query()->where('user_id', $user->getKey())->where('device_id', $deviceId)->whereNull('revoked_at')->latest('last_seen_at')->first();

        if (! $session) {
            return ['status' => 'none'];
        }

        if ($session->last_seen_at->lessThanOrEqualTo(now()->subMinutes($graceMinutes))) {
            $this->revokeSession($session, now());

            return ['status' => 'expired'];
        }

        $session->update(['last_seen_at' => now()]);

        return ['status' => 'ok', 'session' => $session->fresh()];
    }

    /** @return array{active:bool,last_seen_at:?string} */
    public function heartbeat(User $user, string $sessionId): array
    {
        $session = UserSession::query()->whereKey($sessionId)->where('user_id', $user->getKey())->first();

        if (! $session || $session->revoked_at || $session->last_seen_at->lessThanOrEqualTo(now()->subMinutes(5))) {
            if ($session && ! $session->revoked_at) {
                $this->revokeSession($session, now());
            }

            return ['active' => false, 'last_seen_at' => null];
        }

        $session->update(['last_seen_at' => now()]);

        return ['active' => true, 'last_seen_at' => $session->fresh()->last_seen_at->toISOString()];
    }

    public function release(User $user, string $sessionId): void
    {
        UserSession::query()->whereKey($sessionId)->where('user_id', $user->getKey())->whereNull('revoked_at')->update(['revoked_at' => now()]);
    }

    private function resolveUser(string $identifier): ?User
    {
        $identifier = trim($identifier);

        if (str_contains($identifier, '@')) {
            return User::query()->where('email', strtolower($identifier))->first();
        }

        if (ctype_digit($identifier)) {
            $student = Student::query()->where('nisn', $identifier)->with('user')->first();

            if ($student?->user) {
                return $student->user;
            }
        }

        return User::query()->where('username', strtolower($identifier))->first();
    }

    private function revokeSession(UserSession $session, mixed $now): void
    {
        if ($session->personal_access_token_id) {
            PersonalAccessToken::query()->whereKey($session->personal_access_token_id)->delete();
        }

        $session->update(['revoked_at' => $now]);
    }
}
