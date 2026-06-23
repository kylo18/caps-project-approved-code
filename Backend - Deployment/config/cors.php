<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Restrict cross-origin access to the configured frontend origin(s).
    // FRONTEND_URL may be a comma-separated list (e.g. prod + local dev).
    // Wildcard '*' is intentionally NOT used — it is both a security smell and
    // invalid in combination with supports_credentials = true.
    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('FRONTEND_URL', 'https://caps-test2.coeofjrmsu.com'))
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Content-Type',
        'X-Requested-With',
        'Authorization',
        'Accept',
        'Origin',
        'X-CSRF-TOKEN',
        'X-XSRF-TOKEN',
        'Cookie',
    ],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
