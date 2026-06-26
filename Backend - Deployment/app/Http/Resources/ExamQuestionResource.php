<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Student-facing representation of an exam question (with its choices).
 *
 * SECURITY: choices are serialized through {@see ExamChoiceResource}, which
 * strips `isCorrect`. The question itself carries no answer key. Accepts a
 * pre-assembled associative array (questionText already decrypted) so the
 * generator can shape its output through one enforced contract.
 */
class ExamQuestionResource extends JsonResource
{
    public function toArray($request): array
    {
        $r = $this->resource;
        $get = fn (string $key, $default = null) => is_array($r)
            ? ($r[$key] ?? $default)
            : ($r->{$key} ?? $default);

        $choices = $get('choices', []);

        return [
            'questionID'    => $get('questionID'),
            'questionText'  => $get('questionText'),
            'questionImage' => $get('questionImage'),
            'score'         => $get('score'),
            'choices'       => ExamChoiceResource::collection(collect($choices)),
        ];
    }
}
