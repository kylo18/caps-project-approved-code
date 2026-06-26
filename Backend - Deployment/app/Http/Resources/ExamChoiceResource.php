<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Student-facing representation of an answer choice.
 *
 * SECURITY: this resource MUST NOT expose `isCorrect` (or any correctness
 * signal). It is the single, enforced contract for choices sent to students
 * during an exam; correctness lives only on the server and is revealed (per
 * question) by the submission/grading endpoint, never at generation time.
 *
 * Accepts either an Eloquent Choice model or a pre-decrypted associative array
 * (the generator decrypts choiceText before shaping), so callers can reuse it
 * regardless of how the choice was assembled.
 */
class ExamChoiceResource extends JsonResource
{
    public function toArray($request): array
    {
        $r = $this->resource;
        $get = fn (string $key, $default = null) => is_array($r)
            ? ($r[$key] ?? $default)
            : ($r->{$key} ?? $default);

        return [
            'choiceID'    => $get('choiceID'),
            'choiceText'  => $get('choiceText'),
            // Support both the assembled 'choiceImage' key and a raw 'image'.
            'choiceImage' => $get('choiceImage', $get('image')),
            'position'    => $get('position'),
            // NOTE: 'isCorrect' is deliberately omitted — do not add it here.
        ];
    }
}
