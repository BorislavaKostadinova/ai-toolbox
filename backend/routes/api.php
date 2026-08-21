<?php

use App\Http\Controllers\AdminToolController;
use App\Http\Controllers\ToolController;
use App\Http\Middleware\EnsureRole;
use App\Models\Category;
use App\Models\Role;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;

Route::middleware(
    'auth:sanctum'
)->group(function () {

    Route::get(
        '/user',
        function (Request $request) {
            return $request->user();
        }
    );

    /*
     * Categories се кешират за 1 час.
     */
    Route::get(
        '/categories',
        function () {
            return Cache::remember(
                'categories.all',
                now()->addHour(),
                fn () =>
                    Category::orderBy(
                        'name'
                    )->get()
            );
        }
    );

    Route::get(
        '/roles',
        fn () =>
            Role::orderBy('name')
                ->get()
    );

    Route::get(
        '/tags',
        fn () =>
            Tag::orderBy('name')
                ->get()
    );

    /*
     * Съществуващият Tool CRUD остава.
     */
    Route::apiResource(
        'tools',
        ToolController::class
    );

    /*
     * ADMIN ONLY
     */
    Route::middleware(
        EnsureRole::class . ':owner'
    )->prefix('admin')
        ->group(function () {

            Route::get(
                '/tools',
                [
                    AdminToolController::class,
                    'index',
                ]
            );

            Route::post(
                '/tools/{tool}/approve',
                [
                    AdminToolController::class,
                    'approve',
                ]
            );

            Route::post(
                '/tools/{tool}/reject',
                [
                    AdminToolController::class,
                    'reject',
                ]
            );

            Route::get(
                '/activity',
                [
                    AdminToolController::class,
                    'activity',
                ]
            );

            Route::get(
                '/statistics',
                [
                    AdminToolController::class,
                    'statistics',
                ]
            );
        });
});
