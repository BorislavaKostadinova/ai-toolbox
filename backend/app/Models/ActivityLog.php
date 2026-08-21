<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'action',
        'subject_type',
        'subject_id',
        'metadata',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function record(
        string $action,
        ?Model $subject = null,
        array $metadata = []
    ): self {
        $request = request();

        return self::create([
            'user_id' => $request->user()?->id,
            'action' => $action,
            'subject_type' => $subject
                ? $subject::class
                : null,
            'subject_id' => $subject?->getKey(),
            'metadata' => $metadata ?: null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);
    }
}
