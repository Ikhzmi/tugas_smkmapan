<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StudentRequest;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Student::query()->with('user')->orderBy('nama');
        $search = trim($request->string('q')->toString());

        if ($search !== '') {
            $query->where(function (Builder $builder) use ($search): void {
                $builder->where('nama', 'like', '%'.$search.'%')
                    ->orWhere('nisn', 'like', '%'.$search.'%')
                    ->orWhere('nis', 'like', '%'.$search.'%');
            });
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->string('class_id')->toString());
        }

        $students = $query->paginate(min(max($request->integer('per_page', 20), 1), 100));

        return ApiResponse::paginated($students);
    }

    public function store(StudentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $createAccount = (bool) ($data['create_account'] ?? false);
        $initialPassword = null;

        $student = DB::transaction(function () use (&$initialPassword, $data, $createAccount): Student {
            $userId = null;

            if ($createAccount) {
                $initialPassword = $data['password'] ?? Str::password(12);
                $user = User::query()->create([
                    'name' => $data['nama'],
                    'username' => $data['nisn'],
                    'email' => null,
                    'password' => $initialPassword,
                    'role' => 'siswa',
                ]);
                $userId = $user->getKey();
            }

            return Student::query()->create([
                'user_id' => $userId,
                ...array_intersect_key($data, array_flip(['nisn', 'nis', 'nama', 'no_hp', 'alamat', 'class_id'])),
            ]);
        });

        return ApiResponse::created([
            'student' => $student,
            'initial_password' => $initialPassword,
        ], 'Data siswa berhasil dibuat.');
    }

    public function update(StudentRequest $request, Student $student): JsonResponse
    {
        $student->update(array_intersect_key($request->validated(), array_flip(['nisn', 'nis', 'nama', 'no_hp', 'alamat', 'class_id'])));

        return ApiResponse::success($student->fresh(), 'Data siswa berhasil diperbarui.');
    }

    public function destroy(Student $student): Response
    {
        DB::transaction(function () use ($student): void {
            if ($student->user_id) {
                $student->user?->tokens()->delete();
                $student->user?->delete();
            }
            $student->delete();
        });

        return response()->noContent();
    }
}
