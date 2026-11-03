<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['logged_in_at', 'user_id', 'role', 'nama'])]
class LoginEvent extends DomainModel
{
    protected function casts(): array
    {
        return ['logged_in_at' => 'datetime'];
    }
}
