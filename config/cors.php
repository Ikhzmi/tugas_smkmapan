<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Origin tambahan (dipisah koma) via env CORS_ALLOWED_ORIGINS,
    // mis. domain kustom produksi web. Default ditangani patterns di bawah.
    'allowed_origins' => array_values(array_filter(array_map('trim', explode(
        ',',
        (string) env('CORS_ALLOWED_ORIGINS', '')
    )))),

    // Autentikasi memakai Bearer token (bukan cookie), jadi mengizinkan
    // origin publik berikut aman: tidak ada kredensial yang ikut terkirim.
    'allowed_origins_patterns' => [
        // Deployment web di Vercel (produksi + preview).
        '~^https://[a-z0-9-]+\.vercel\.app$~',
        // Domain kustom produksi (www maupun apex).
        '~^https://(www\.)?smkmd08medan\.my\.id$~',
        // Server dev Vite (port bebas: 5173, 4173, dsb.).
        '~^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$~',
        // IP LAN untuk uji di HP (server.host aktif di vite.config.js).
        '~^http://(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$~',
    ],

    'allowed_headers' => ['Authorization', 'Content-Type', 'Accept', 'Origin', 'X-Requested-With'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
