<?php
namespace App\Helpers;

use App\Models\ActivityLog;

class ActivityLogger
{
    public static function log(string $action, ?string $description = null): void
    {
        $user = auth()->user();

        ActivityLog::create([
            'user_id'     => $user?->id,
            'action'      => $action,
            'description' => $description,
            'ip_address'  => request()->ip(),
            'user_agent'  => request()->userAgent(),
        ]);
    }
}
