<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Upload Disks
    |--------------------------------------------------------------------------
    |
    | Disk yang dipakai endpoint upload. Secara default memakai disk lokal agar
    | development dan test tetap berjalan tanpa kredensial cloud. Saat deploy
    | (mis. Vercel) arahkan ke disk Supabase Storage di bawah.
    |
    */

    'media_disk' => env('MEDIA_DISK', 'public'),
    'private_disk' => env('PRIVATE_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

        /*
         * Supabase Storage memakai protokol S3. Kunci akses hanya disimpan di
         * server; mobile tidak pernah menerima kredensial ini.
         *
         * - supabase        : bucket privat (materi, berkas tugas)
         * - supabase-public : bucket publik (gambar CMS)
         */
        'supabase' => [
            'driver' => 's3',
            'key' => env('SUPABASE_S3_KEY'),
            'secret' => env('SUPABASE_S3_SECRET'),
            'region' => env('SUPABASE_S3_REGION', 'ap-northeast-2'),
            'bucket' => env('SUPABASE_S3_BUCKET'),
            'endpoint' => env('SUPABASE_S3_ENDPOINT'),
            'use_path_style_endpoint' => true,
            'request_checksum_calculation' => 'when_required',
            'throw' => false,
            'report' => false,
        ],

        'supabase-public' => [
            'driver' => 's3',
            'key' => env('SUPABASE_S3_KEY'),
            'secret' => env('SUPABASE_S3_SECRET'),
            'region' => env('SUPABASE_S3_REGION', 'ap-northeast-2'),
            'bucket' => env('SUPABASE_S3_PUBLIC_BUCKET'),
            'url' => env('SUPABASE_S3_PUBLIC_URL'),
            'endpoint' => env('SUPABASE_S3_ENDPOINT'),
            'use_path_style_endpoint' => true,
            'request_checksum_calculation' => 'when_required',
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
