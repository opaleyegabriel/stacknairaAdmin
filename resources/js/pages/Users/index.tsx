import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useEffect, useRef } from 'react';
import debounce from 'lodash/debounce';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner"
import InertiaPagination from '@/components/inertia-pagination';
import {can} from '@/lib/can';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { route } from 'ziggy-js';
import { BreadcrumbItem } from '@/types';


const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Roles',
    href: route('roles.index'),
  },
];

interface UserRole {
  id: number;
  name: string;
}

interface UserType {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  roles?: UserRole[];
}

interface UsersType {
  data: UserType[];
  links: {
    url: string;
    label: string;
    active: boolean;
  }[];
  from: number;
  to: number;
  total: number;
}

export default function UserIndex({ users }: { users: UsersType }) {
  const { flash } = usePage<{ flash: { message?: string } }>().props;
const { auth } = usePage().props;
// console.log(auth.permissions); // Should log: ["create users", ...]


  useEffect(() => {
    if (flash.message) {
      toast.success(flash.message);
    }
  }, [flash.message]);

  const handleSearch = useRef(
    debounce((query: string) => {
        router.get(route('users.index'), { search: query }, { preserveState: true, replace: true });
    }, 500)
  ).current;

  function onSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleSearch(e.target.value);
  }

  function deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      router.delete(route('users.destroy', { user: id }));
    }
  }

  return (
    <AppLayout breadcrumbs={[{ title: 'Users', href: route('users.index') }]}>
      <Head title="Users" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="rounded border p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="relative w-full sm:w-1/3">
              <Input id="search" className="peer ps-9" placeholder="Search..." type="search" onChange={onSearchChange} />
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 text-muted-foreground/80">
                <Search size={16} />
              </div>
            </div>
            
            {can('create_users') && (
              <Button>
                <Link href={route('users.create')} prefetch>
                  Create User
                </Link>
              </Button>
            )}
          </div>
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.data.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone ?? '—'}</TableCell>
                      <TableCell>
                        {user.roles?.length
                          ? user.roles.map((role) => (
                              <Badge key={role.id} variant="outline" className="mr-1">
                                {role.name}
                              </Badge>
                            ))
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {user.status == '0' ? (
                          <Badge className="bg-red-500">Inactive</Badge>
                        ) : (
                          <Badge className="bg-green-500">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="space-x-1">
                        {/* {can('edit_users') && ( */}
                          <Button asChild size="sm">
                          <Link href={route('users.edit', { user: user.id })} prefetch>
                            Edit
                          </Link>
                        </Button>
                        {/* )} */}
                        {can('delete_users') && (
                          <Button onClick={() => deleteUser(user.id)} size="sm" variant="destructive">
                            Delete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <InertiaPagination data={users} />
        </div>
      </div>
    </AppLayout>
  );
}
