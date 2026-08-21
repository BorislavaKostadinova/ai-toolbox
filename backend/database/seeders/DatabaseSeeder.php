<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'owner@example.com'],
            [
                'name' => 'Ivan Ivanov',
                'role' => 'owner',
                'password' => Hash::make('password'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'backend@example.com'],
            [
                'name' => 'Backend Developer',
                'role' => 'backend',
                'password' => Hash::make('password'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'frontend@example.com'],
            [
                'name' => 'Frontend Developer',
                'role' => 'frontend',
                'password' => Hash::make('password'),
            ]
        );

        $this->call(ToolDataSeeder::class);
    }
}
