import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEffect, useRef, useState } from 'react';
import { toast } from "sonner"
import { Badge } from '@/components/ui/badge';
import debounce from 'lodash/debounce';
import InertiaPagination from '@/components/inertia-pagination';
import { can } from '@/lib/can';
import { route } from 'ziggy-js';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Roles',
    href: route('roles.index'),
  },
];


interface PermissionType {
  id: number;
  name: string;
}

interface LinksType {
  url: string;
  label: string;
  active: boolean;
}

interface RoleType {
  id: number;
  name: string;
  permissions: PermissionType[];
}

interface RolesType {
  data: RoleType[];
  links: LinksType[];
  from: number;
  to: number;
  total: number;
}

export default function Dashboard({ roles }: { roles: RolesType }) {
  const { flash } = usePage<{ flash: { message?: string } }>().props;
  const [expandedRoles, setExpandedRoles] = useState<{ [key: number]: boolean }>({});
  // Show flash message
  useEffect(() => {
    if (flash.message) {
      toast.success(flash.message);
    }
  }, [flash.message]);

  // Debounced search
  const handleSearch = useRef(
    debounce((query: string) => {
      router.get(route('roles.index'), { search: query }, { preserveState: true, replace: true });
    }, 500),
  ).current;

  function onSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleSearch(e.target.value);
  }

  function toggleRolePermissions(roleId: number) {
    setExpandedRoles(prev => ({
      ...prev,
      [roleId]: !prev[roleId],
    }));
  }

  function deleteRoles(id: number) {
    if (confirm('Are you sure you want to delete this role?')) {
    router.delete(route('roles.destroy', { role: id }));
    toast.success('Role deleted successfully');
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Roles" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="rounded border p-6 shadow-xl">
          {/* Search + Create Role */}
          <div className="flex items-center justify-between mb-5">
            <div className="relative w-full sm:w-1/3">
              <Input
                id="search"
                className="peer ps-9"
                placeholder="Search..."
                type="search"
                onChange={onSearchChange}
              />
              <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 
                flex items-center justify-center ps-3 peer-disabled:opacity-50">
                <Search size={16} aria-hidden="true" />
              </div>
            </div>
            {/* {can('create_roles') && ( */}
              <Button asChild>
                <Link href={route('roles.create')} prefetch>
                  Create Role
                </Link>
              </Button>
             {/* )}  */}
          </div>

          {/* Table */}
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.data?.map((role, index) => (
                    <TableRow key={role.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{role.name}</TableCell>
                      <TableCell className="align-top">
                        {role.permissions.length > 0 ? (
                            <div className="flex flex-col">
                            <div className="flex flex-wrap gap-1 items-center">
                                {role.permissions
                                .slice(0, expandedRoles[role.id] ? role.permissions.length : 5)
                                .map(permission => (
                                    <Badge
                                    key={permission.id}
                                    variant="secondary"
                                    className="bg-green-100 text-green-800 text-xs font-medium"
                                    >
                                    {permission.name.replace(/_/g, ' ')}
                                    </Badge>
                                ))}

                                {/* +X more beside badges when collapsed */}
                                {!expandedRoles[role.id] && role.permissions.length > 5 && (
                                <button
                                    onClick={() => toggleRolePermissions(role.id)}
                                    className="text-xs text-blue-600 underline"
                                >
                                    +{role.permissions.length - 5} more
                                </button>
                                )}
                            </div>

                            {/* Show less at bottom when expanded */}
                            {expandedRoles[role.id] && role.permissions.length > 5 && (
                                <button
                                onClick={() => toggleRolePermissions(role.id)}
                                className="mt-1 text-xs text-blue-600 underline self-start"
                                >
                                Show less
                                </button>
                            )}
                            </div>
                        ) : (
                            <span className="text-muted-foreground">No Permissions</span>
                        )}
                    </TableCell>


                      {/* Action buttons */}
                      <TableCell className="space-x-1">
                        {/* {can('edit_roles') && ( */}
                          <Button asChild size="sm">
                            <Link href={route('roles.edit', { role: role.id })} prefetch>      
                                Edit
                            </Link>
                          </Button>
                        {/* )} */}
                        {/* {can('delete_roles') && ( */}
                          <Button
                            onClick={() => deleteRoles(role.id)}
                            size="sm"
                            variant="destructive"
                          >
                            Delete
                          </Button>
                        {/* )} */}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          <InertiaPagination data={roles} />
        </div>
      </div>
    </AppLayout>
  );
}
