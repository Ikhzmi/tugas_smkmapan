<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SecureRls extends Command
{
    protected $signature = 'db:secure-rls';

    protected $description = 'Enable row-level security on every public schema table without creating policies.';

    public function handle(): int
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->info('Skipped: RLS is PostgreSQL-specific.');

            return self::SUCCESS;
        }

        if (! (bool) env('SUPABASE_NEW_PROJECT_CONFIRMED', false)) {
            $this->error('Stopped: set SUPABASE_NEW_PROJECT_CONFIRMED=true only after confirming the new Supabase project.');

            return self::FAILURE;
        }

        $tables = DB::select("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");

        foreach ($tables as $table) {
            $name = $table->tablename;

            if (! preg_match('/^[a-z_][a-z0-9_]*$/', $name)) {
                continue;
            }

            DB::statement(sprintf('ALTER TABLE public.%s ENABLE ROW LEVEL SECURITY', $name));
        }

        $this->info(sprintf('Enabled RLS on %d public tables without creating policies.', count($tables)));

        return self::SUCCESS;
    }
}
