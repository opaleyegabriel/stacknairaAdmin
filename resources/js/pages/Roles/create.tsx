import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import InputError from '@/components/input-error';
import { route } from 'ziggy-js';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Create Role',
    href: route('roles.create'),
  },
];

export default function CreateRole({ permissions }: { permissions: string[] }) {
  const { data, setData, post, errors, processing } = useForm<{
    name: string;
    permissions: string[];
  }>({
    name: '',
    permissions: [],
  });

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    post(route('roles.store'));
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Roles" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="rounded border p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="text-xl text-slate-600">Create Role</div>
            <Button>
              <Link href={route('roles.index')} prefetch>
                Go Back
              </Link>
            </Button>
          </div>

          <Card>
            <CardContent>
              <form onSubmit={handleFormSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Role Name</Label>
                    <Input
                      type="text"
                      id="name"
                      placeholder="Name"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      aria-invalid={!!errors.name}
                    />
                    <InputError message={errors.name} />
                  </div>
                </div>

                <div className="col-span-2 mt-4">
                  <Label htmlFor="permissions" className="mb-2 text-lg font-semibold">
                    Permissions
                  </Label>

                  {Object.entries(
                    permissions
                      .sort()
                      .reduce((groups: Record<string, string[]>, perm: string) => {
                        const [_, category] = perm.split('_');
                        if (!groups[category]) groups[category] = [];
                        groups[category].push(perm);
                        return groups;
                      }, {})
                  )
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([category, perms]) => (
                      <div key={category} className="mb-4 border rounded-lg shadow-sm overflow-hidden">
                        <details className="group">
                          <summary
                            className="cursor-pointer flex justify-between items-center p-3
                            bg-slate-100 hover:bg-slate-200 group-open:bg-slate-200
                            dark:bg-slate-800 dark:hover:bg-slate-700 dark:group-open:bg-slate-700
                            transition-colors"
                          >
                            <span className="capitalize font-medium">{category.replace(/_/g, ' ')}</span>
                            <span className="transition-transform duration-300 group-open:rotate-90">▶</span>
                          </summary>

                          <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {perms.sort().map((perm) => (
                              <div
                                key={perm}
                                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                                  data.permissions.includes(perm)
                                    ? 'bg-blue-50 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-700'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                              >
                                <Checkbox
                                  id={`permission-${perm}`}
                                  checked={data.permissions.includes(perm)}
                                  onCheckedChange={(checked) => {
                                    setData(
                                      'permissions',
                                      checked
                                        ? [...data.permissions, perm]
                                        : data.permissions.filter((p) => p !== perm)
                                    );
                                  }}
                                />
                                <Label htmlFor={`permission-${perm}`} className="select-none">
                                  {perm.replace(/_/g, ' ')}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    ))}

                  <InputError message={errors.permissions} />
                </div>

                <div className="mt-4 text-end">
                  <Button size="lg" type="submit" disabled={processing}>
                    {processing && <Loader2 className="animate-spin mr-2" />}
                    Create Role
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
