<?php

namespace App\Database;

use Illuminate\Database\Query\Grammars\PostgresGrammar as BasePostgresGrammar;

class PostgresGrammar extends BasePostgresGrammar
{
    /**
     * Include the timezone offset so timestamptz columns store the correct UTC
     * instant when the application timezone is not UTC (e.g. Asia/Jakarta).
     */
    public function getDateFormat(): string
    {
        return 'Y-m-d H:i:sP';
    }
}