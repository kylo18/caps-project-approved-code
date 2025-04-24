<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies as Middleware;
use Symfony\Component\HttpFoundation\Request;

class TrustProxies extends Middleware
{
    /**
     * The trusted proxies for this application.
     *
     * Use ['*'] to trust all proxies (common when behind a load balancer like NGINX).
     * Alternatively, you can specify individual IPs or ranges.
     *
     * @var array|string|null
     */
    protected $proxies = '18.142.190.113';

    /**
     * The headers that should be used to detect proxies.
     *
     * Use `X-Forwarded-*` headers typically set by NGINX.
     *
     * @var int
     */
    protected $headers = Request::HEADER_X_FORWARDED_AWS_ELB;
}
