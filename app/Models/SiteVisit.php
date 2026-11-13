<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['visited_at', 'path', 'role', 'user_id', 'session_id', 'user_agent'])]
class SiteVisit extends DomainModel
{
    protected function casts(): array
    {
        return ['visited_at' => 'datetime'];
    }
}
