<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreToolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],

            'url' => ['required', 'url', 'max:2048'],

            'documentation_url' => [
                'nullable',
                'url',
                'max:2048'
            ],

            'description' => [
                'required',
                'string',
                'min:10',
                'max:5000'
            ],

            'usage' => [
                'nullable',
                'string',
                'max:10000'
            ],

            'examples' => [
                'nullable',
                'string',
                'max:10000'
            ],

            'difficulty' => [
                'nullable',
                'in:beginner,intermediate,advanced'
            ],

            'categories' => [
                'required',
                'array',
                'min:1'
            ],

            'categories.*' => [
                'integer',
                'exists:categories,id'
            ],

            'roles' => [
                'required',
                'array',
                'min:1'
            ],

            'roles.*' => [
                'integer',
                'exists:roles,id'
            ],

            'tags' => [
                'nullable',
                'array'
            ],

            'tags.*' => [
                'integer',
                'exists:tags,id'
            ],

            'image' => [
                'nullable',
                'image',
                'max:5120'
            ],
        ];
    }
}
