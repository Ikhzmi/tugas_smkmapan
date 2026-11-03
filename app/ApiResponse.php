<?php

namespace App;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;

class ApiResponse
{
    public static function success(mixed $data, string $message = 'Berhasil.', array $meta = [], int $status = 200): JsonResponse
    {
        return response()->json([
            'data' => $data,
            'message' => $message,
            'meta' => $meta,
        ], $status);
    }

    public static function created(mixed $data, string $message = 'Berhasil dibuat.'): JsonResponse
    {
        return self::success($data, $message, [], 201);
    }

    public static function paginated(LengthAwarePaginator $paginator, string $message = 'Berhasil.'): JsonResponse
    {
        return self::success($paginator->items(), $message, [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
        ]);
    }

    public static function error(string $message, array $errors = [], int $status = 422, ?string $code = null): JsonResponse
    {
        return response()->json(array_filter([
            'message' => $message,
            'errors' => $errors,
            'code' => $code,
        ], static fn (mixed $value): bool => $value !== null), $status);
    }
}
