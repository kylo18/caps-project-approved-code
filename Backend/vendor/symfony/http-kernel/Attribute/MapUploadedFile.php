<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\HttpKernel\Attribute;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Controller\ArgumentResolver\RequestPayloadValueResolver;
use Symfony\Component\HttpKernel\ControllerMetadata\ArgumentMetadata;
use Symfony\Component\Validator\Constraint;

#[\Attribute(\Attribute::TARGET_PARAMETER)]
class MapUploadedFile extends ValueResolver
{
    public ArgumentMetadata $metadata;

    /**
     * @param array<string>|string|null               $acceptFormat               The payload formats to accept (i.e. "json", "xml")
     * @param array<string, mixed>                    $serializationContext       The serialization context to use when deserializing the payload
     * @param string|GroupSequence|array<string>|null $validationGroups           The validation groups to use when validating the query string mapping
     * @param class-string                            $resolver                   The class name of the resolver to use
     * @param int                                     $validationFailedStatusCode The HTTP code to return if the validation fails
     * @param class-string|string|null                $type                       The element type for array deserialization
     */
    public function __construct(
        /** @var Constraint|array<Constraint>|null */
        public Constraint|array|null $constraints = null,
        public ?string $name = null,
        string $resolver = RequestPayloadValueResolver::class,
        public readonly int $validationFailedStatusCode = Response::HTTP_UNPROCESSABLE_ENTITY,
        public readonly ?string $type = null,
    ) {
        parent::__construct($resolver);
    }
}
