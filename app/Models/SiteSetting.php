<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['key', 'value'])]
class SiteSetting extends DomainModel
{
    protected $primaryKey = 'key';

    public function getIncrementing(): bool
    {
        return false;
    }

    public function getKeyType(): string
    {
        return 'string';
    }

    protected function casts(): array
    {
        return ['value' => 'array'];
    }
}
