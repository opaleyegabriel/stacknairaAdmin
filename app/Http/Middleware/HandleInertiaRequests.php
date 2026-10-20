<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),

            'name' => config('app.name'),
            'appName' => fn () => $request->user()?->hospital?->hospital_name ?? 'EMR',
            'logoUrl' => fn () => $request->user()?->hospital?->logo_url
                ? asset('storage/' . $request->user()->hospital->logo_url)
                : null,

            'quote' => [
                'message' => trim($message),
                'author' => trim($author),
            ],

            'auth' => [
                'user' => $request->user()?->only('id', 'name', 'email') ?? null,
                'permissions' => fn () => $request->user()?->getAllPermissions()->pluck('name') ?? [],
            ],

            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],

            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',

            'flash' => [
                'message' => fn () => $request->session()->get('message'),
            ],
        ];
    }

}
