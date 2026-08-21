<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tool extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'url',
        'documentation_url',
        'description',
        'usage',
        'examples',
        'documentation_markdown',
        'image',
        'difficulty',
        'status',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(
            User::class,
            'reviewed_by'
        );
    }

    public function categories()
    {
        return $this->belongsToMany(Category::class);
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class);
    }
}
