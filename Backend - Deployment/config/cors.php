<?php

$frontendUrl = env('FRONTEND_URL');

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_filter([
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:8005',
        'http://127.0.0.1:8005',
        'http://localhost:80',
        'http://localhost',
        'http://127.0.0.1:80',
        'http://127.0.0.1',
        'http://192.168.254.164.nip.io:8000',
        'http://192.168.254.164.nip.io:5173',
        'http://192.168.254.164:8000',
        'http://192.168.254.164:5173',
        'http://192.168.254.166:5173',
        'http://' . env('VITE_SERVER_IP', 'localhost') . ':8000',
        'http://' . env('VITE_SERVER_IP', 'localhost') . ':8005',
        'http://' . env('VITE_SERVER_IP', 'localhost') . ':5173',
        'http://100.91.44.24:8005',
        'http://100.112.226.110:8005',
        'http://100.91.44.24:8000',
        'http://100.112.226.110:8000',
        $frontendUrl,
    ]),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
