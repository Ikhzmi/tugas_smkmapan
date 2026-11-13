<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
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
        //
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
