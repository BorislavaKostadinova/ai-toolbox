<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Role;
use App\Models\Tag;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ToolDataSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'AI Assistants',
            'Coding',
            'Image Generation',
            'Writing',
            'Research',
            'Automation',
            'Data Analysis',
        ];

        foreach ($categories as $name) {
            Category::updateOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name]
            );
        }

        $roles = [
            'Backend Developer',
            'Frontend Developer',
            'Product Manager',
            'Data Scientist',
            'Designer',
            'DevOps',
            'Owner',
        ];

        foreach ($roles as $name) {
            Role::updateOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name]
            );
        }

        $tags = [
            'coding',
            'productivity',
            'automation',
            'research',
            'writing',
            'design',
            'data',
        ];

        foreach ($tags as $name) {
            Tag::updateOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name]
            );
        }
    }
}
