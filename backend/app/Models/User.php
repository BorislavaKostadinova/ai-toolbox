<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'two_factor_enabled',
        'two_factor_method',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_enabled' => 'boolean',
        ];
    }

    public function tools()
    {
        return $this->hasMany(Tool::class);
    }

    public function reviewedTools()
    {
        return $this->hasMany(
            Tool::class,
            'reviewed_by'
        );
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }
}
