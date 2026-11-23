<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class TeacherRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nama' => ['required', 'string', 'max:150'],
            'gelar' => ['nullable', 'string', 'max:100'],
            'jabatan' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:150'],
            'jam_kerja' => ['nullable', 'string', 'max:100'],
            'bio' => ['nullable', 'string', 'max:5000'],
            'sertifikasi' => ['nullable', 'array'],
            'foto_url' => ['nullable', 'url', 'max:2048'],
            'create_account' => ['sometimes', 'boolean'],
            'username' => ['nullable', 'string', 'max:100', 'regex:/^[A-Za-z0-9._-]+$/', 'unique:users,username'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ];
    }
}
