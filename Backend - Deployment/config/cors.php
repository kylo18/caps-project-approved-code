<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],


    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:80',
        'http://localhost',
        'http://127.0.0.1:80',
        'http://127.0.0.1',
        'http://192.168.254.164.nip.io:8000',
        'http://192.168.254.164.nip.io:5173',
        'http://192.168.254.164:8000',
        'http://192.168.254.164:5173',
        'http://192.168.254.166:5173',
        env('FRONTEND_URL'),
    ],

    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];