<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],


    'allowed_origins' => [
        'http://' . env('VITE_SERVER_IP', 'localhost') . ':8000',
        'http://' . env('VITE_SERVER_IP', 'localhost') . ':8005',
        'http://' . env('VITE_SERVER_IP', 'localhost') . ':5173',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:80',
        'http://localhost',
        'http://127.0.0.1:80',
        'http://127.0.0.1',
        env('FRONTEND_URL'),
    ],

    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];