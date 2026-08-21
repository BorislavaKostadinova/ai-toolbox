<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreToolRequest;
use App\Models\ActivityLog;
use App\Models\Tool;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ToolController extends Controller
{
    public function index(Request $request)
    {
        $query = Tool::with([
            'categories',
            'roles',
            'tags',
            'user',
        ])->where(
            'status',
            'approved'
        );

        if ($request->filled('name')) {
            $query->where(
                'name',
                'like',
                '%' .
                    $request->name .
                    '%'
            );
        }

        if ($request->filled('category')) {
            $query->whereHas(
                'categories',
                fn ($query) =>
                    $query->where(
                        'categories.id',
                        $request->category
                    )
            );
        }

        if ($request->filled('role')) {
            $query->whereHas(
                'roles',
                fn ($query) =>
                    $query->where(
                        'roles.id',
                        $request->role
                    )
            );
        }

        if ($request->filled('tag')) {
            $query->whereHas(
                'tags',
                fn ($query) =>
                    $query->where(
                        'tags.id',
                        $request->tag
                    )
            );
        }

        return $query
            ->latest()
            ->paginate(12);
    }

    public function store(
        StoreToolRequest $request
    ) {
        $validated =
            $request->validated();

        $tool = DB::transaction(
            function () use (
                $request,
                $validated
            ) {
                $imagePath = null;

                if (
                    $request->hasFile(
                        'image'
                    )
                ) {
                    $imagePath =
                        $request
                            ->file('image')
                            ->store(
                                'tools',
                                'public'
                            );
                }

                $tool = Tool::create([
                    'user_id' =>
                        $request->user()->id,

                    'name' =>
                        $validated['name'],

                    'url' =>
                        $validated['url'],

                    'documentation_url' =>
                        $validated[
                            'documentation_url'
                        ] ?? null,

                    'description' =>
                        $validated[
                            'description'
                        ],

                    'usage' =>
                        $validated[
                            'usage'
                        ] ?? null,

                    'examples' =>
                        $validated[
                            'examples'
                        ] ?? null,

                    'difficulty' =>
                        $validated[
                            'difficulty'
                        ] ?? null,

                    'image' =>
                        $imagePath,

                    /*
                     * Всеки нов tool чака
                     * административно одобрение.
                     */
                    'status' =>
                        'pending',
                ]);

                $tool
                    ->categories()
                    ->sync(
                        $validated[
                            'categories'
                        ]
                    );

                $tool
                    ->roles()
                    ->sync(
                        $validated[
                            'roles'
                        ]
                    );

                $tool
                    ->tags()
                    ->sync(
                        $validated[
                            'tags'
                        ] ?? []
                    );

                return $tool;
            }
        );

        ActivityLog::record(
            'tool_created',
            $tool,
            [
                'tool_name' =>
                    $tool->name,

                'status' =>
                    'pending',
            ]
        );

        Cache::forget(
            'tools.status_counts'
        );

        return response()->json([
            'message' =>
                'Tool submitted successfully and is awaiting approval.',

            'tool' =>
                $tool->load([
                    'categories',
                    'roles',
                    'tags',
                    'user',
                ]),
        ], 201);
    }

    public function show(
        Request $request,
        Tool $tool
    ) {
        /*
         * Approved tool е видим за всички
         * логнати потребители.
         *
         * Pending/rejected е видим за:
         * - автора
         * - owner
         */
        if (
            $tool->status !== 'approved' &&
            $tool->user_id !==
                $request->user()->id &&
            $request->user()->role !==
                'owner'
        ) {
            abort(403);
        }

        return $tool->load([
            'categories',
            'roles',
            'tags',
            'user',
            'reviewer',
        ]);
    }

    public function update(
        StoreToolRequest $request,
        Tool $tool
    ) {
        $validated =
            $request->validated();

        $tool = DB::transaction(
            function () use (
                $request,
                $validated,
                $tool
            ) {
                $data = [
                    'name' =>
                        $validated['name'],

                    'url' =>
                        $validated['url'],

                    'documentation_url' =>
                        $validated[
                            'documentation_url'
                        ] ?? null,

                    'description' =>
                        $validated[
                            'description'
                        ],

                    'usage' =>
                        $validated[
                            'usage'
                        ] ?? null,

                    'examples' =>
                        $validated[
                            'examples'
                        ] ?? null,

                    'difficulty' =>
                        $validated[
                            'difficulty'
                        ] ?? null,
                ];

                if (
                    $request->hasFile(
                        'image'
                    )
                ) {
                    if ($tool->image) {
                        Storage::disk(
                            'public'
                        )->delete(
                            $tool->image
                        );
                    }

                    $data['image'] =
                        $request
                            ->file('image')
                            ->store(
                                'tools',
                                'public'
                            );
                }

                /*
                 * След редакция tool отново
                 * трябва да бъде проверен.
                 */
                $data['status'] =
                    'pending';

                $data['reviewed_by'] =
                    null;

                $data['reviewed_at'] =
                    null;

                $data['rejection_reason'] =
                    null;

                $tool->update($data);

                $tool
                    ->categories()
                    ->sync(
                        $validated[
                            'categories'
                        ]
                    );

                $tool
                    ->roles()
                    ->sync(
                        $validated[
                            'roles'
                        ]
                    );

                $tool
                    ->tags()
                    ->sync(
                        $validated[
                            'tags'
                        ] ?? []
                    );

                return $tool;
            }
        );

        ActivityLog::record(
            'tool_updated',
            $tool,
            [
                'tool_name' =>
                    $tool->name,

                'status' =>
                    'pending',
            ]
        );

        Cache::forget(
            'tools.status_counts'
        );

        return response()->json([
            'message' =>
                'Tool updated and submitted for approval.',

            'tool' =>
                $tool->load([
                    'categories',
                    'roles',
                    'tags',
                    'user',
                ]),
        ]);
    }

    public function destroy(
        Tool $tool
    ) {
        if ($tool->image) {
            Storage::disk('public')
                ->delete($tool->image);
        }

        ActivityLog::record(
            'tool_deleted',
            $tool,
            [
                'tool_name' =>
                    $tool->name,
            ]
        );

        $tool->delete();

        Cache::forget(
            'tools.status_counts'
        );

        return response()->noContent();
    }
}
