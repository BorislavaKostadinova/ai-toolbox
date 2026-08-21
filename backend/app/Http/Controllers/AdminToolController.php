<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Tool;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class AdminToolController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'status' => [
                'nullable',
                Rule::in([
                    'pending',
                    'approved',
                    'rejected',
                ]),
            ],
            'category' => [
                'nullable',
                'integer',
                'exists:categories,id',
            ],
            'role' => [
                'nullable',
                'integer',
                'exists:roles,id',
            ],
            'name' => [
                'nullable',
                'string',
                'max:255',
            ],
        ]);

        $query = Tool::with([
            'categories',
            'roles',
            'tags',
            'user',
            'reviewer',
        ]);

        if ($request->filled('status')) {
            $query->where(
                'status',
                $request->status
            );
        }

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
                function ($query) use ($request) {
                    $query->where(
                        'categories.id',
                        $request->category
                    );
                }
            );
        }

        if ($request->filled('role')) {
            $query->whereHas(
                'roles',
                function ($query) use ($request) {
                    $query->where(
                        'roles.id',
                        $request->role
                    );
                }
            );
        }

        return response()->json([
            'tools' => $query
                ->latest()
                ->paginate(20),

            'counts' => $this->statusCounts(),
        ]);
    }

    public function approve(
        Request $request,
        Tool $tool
    ) {
        $tool->update([
            'status' => 'approved',
            'reviewed_by' =>
                $request->user()->id,
            'reviewed_at' => now(),
            'rejection_reason' => null,
        ]);

        ActivityLog::record(
            'tool_approved',
            $tool,
            [
                'tool_name' => $tool->name,
            ]
        );

        $this->clearToolCaches();

        return response()->json([
            'message' =>
                'Tool approved successfully.',
            'tool' => $tool->load([
                'categories',
                'roles',
                'tags',
                'user',
                'reviewer',
            ]),
        ]);
    }

    public function reject(
        Request $request,
        Tool $tool
    ) {
        $validated = $request->validate([
            'reason' => [
                'required',
                'string',
                'min:5',
                'max:2000',
            ],
        ]);

        $tool->update([
            'status' => 'rejected',
            'reviewed_by' =>
                $request->user()->id,
            'reviewed_at' => now(),
            'rejection_reason' =>
                $validated['reason'],
        ]);

        ActivityLog::record(
            'tool_rejected',
            $tool,
            [
                'tool_name' => $tool->name,
                'reason' => $validated['reason'],
            ]
        );

        $this->clearToolCaches();

        return response()->json([
            'message' =>
                'Tool rejected successfully.',
            'tool' => $tool->load([
                'categories',
                'roles',
                'tags',
                'user',
                'reviewer',
            ]),
        ]);
    }

    public function activity()
    {
        return ActivityLog::with('user')
            ->latest('created_at')
            ->paginate(50);
    }

    public function statistics()
    {
        return response()->json(
            $this->statusCounts()
        );
    }

    private function statusCounts(): array
    {
        return Cache::remember(
            'tools.status_counts',
            now()->addMinutes(5),
            fn () => [
                'total' =>
                    Tool::count(),

                'pending' =>
                    Tool::where(
                        'status',
                        'pending'
                    )->count(),

                'approved' =>
                    Tool::where(
                        'status',
                        'approved'
                    )->count(),

                'rejected' =>
                    Tool::where(
                        'status',
                        'rejected'
                    )->count(),
            ]
        );
    }

    private function clearToolCaches(): void
    {
        Cache::forget(
            'tools.status_counts'
        );
    }
}
