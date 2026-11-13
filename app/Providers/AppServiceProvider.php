<?php

namespace App\Providers;

use App\Database\PostgresGrammar;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Connection;
use Illuminate\Database\PostgresConnection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Postgres timestamptz needs the offset in the date format, otherwise a
        // non-UTC app timezone (Asia/Jakarta) is stored as if it were UTC.
        Connection::resolverFor('pgsql', function ($pdo, $database, $prefix, $config): PostgresConnection {
            $connection = new PostgresConnection($pdo, $database, $prefix, $config);
            $connection->setQueryGrammar(new PostgresGrammar($connection));

            return $connection;
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('login', static function (Request $request): Limit {
            return Limit::perMinute(5)->by(strtolower((string) $request->ip()).'|'.strtolower((string) $request->input('identifier')));
        });

        RateLimiter::for('public-forms', static function (Request $request): Limit {
            return Limit::perMinute(10)->by((string) $request->ip());
        });

        RateLimiter::for('exam-code', static function (Request $request): Limit {
            return Limit::perMinute(5)->by((string) $request->user()?->getAuthIdentifier().'|'.(string) $request->route('exam'));
        });

        RateLimiter::for('auth-actions', static function (Request $request): Limit {
            return Limit::perMinute(60)->by((string) $request->user()?->getAuthIdentifier());
        });
    }
}
