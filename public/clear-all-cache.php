<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

header('Content-Type: text/plain');

app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
echo "✅ Spatie permission cache cleared\n";

\Illuminate\Support\Facades\Cache::flush();
echo "✅ Laravel cache flushed\n";

\Artisan::call('config:clear');
echo "✅ Config cleared\n";
\Artisan::call('route:clear');
echo "✅ Routes cleared\n";
\Artisan::call('view:clear');
echo "✅ Views cleared\n";

if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "✅ OPcache reset\n";
}

foreach (glob(__DIR__.'/../bootstrap/cache/*.php') as $file) {
    @unlink($file);
}
echo "✅ bootstrap/cache files removed\n";

echo "\nDone. Log out and log back in, then retry the reset.\n";