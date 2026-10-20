import { usePage } from '@inertiajs/react';

export function can(permission: string): boolean {
  const { auth } = usePage().props as {
    auth: {
      permissions: string[];
    };
  };
// console.log(auth.permissions); // Check what’s actually in the array
// console.log(usePage().props);

  return auth.permissions.includes(permission);
}
