<?php

namespace Modules\Analytics\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lesson extends Model
{
    use HasFactory;

    protected $table = 'lessons';

    protected $fillable = [
        'title',
        'description',
        'subject_id',
        'display_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'display_order' => 'integer',
    ];

    /**
     * Get the subject that owns this lesson.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(\Modules\Subjects\Models\Subject::class, 'subject_id', 'subjectID');
    }

    /**
     * Get all lesson views for this lesson.
     */
    public function views(): HasMany
    {
        return $this->hasMany(LessonView::class, 'lesson_id');
    }
}
