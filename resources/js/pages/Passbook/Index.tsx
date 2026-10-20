// resources/js/Pages/Passbook/Index.tsx

import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Search,
    User,
    FileText,
    Eye,
    BookOpen
} from 'lucide-react';
import type { PassbookIndexProps } from '@/types/passbook';
import InertiaPagination from '@/components/inertia-pagination';
import { route } from 'ziggy-js';

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function PassbookIndex({ members, filters }: PassbookIndexProps) {
    const [search, setSearch] = useState<string>(filters.search || '');
    const [status, setStatus] = useState<string>(filters.status || 'all');

    const debouncedSearch = useDebounce(search, 500);
    const debouncedStatus = useDebounce(status, 300);

    useEffect(() => {
        const currentFilters = {
            search: debouncedSearch || undefined,
            status: debouncedStatus !== 'all' ? debouncedStatus : undefined,
        };

        const hasChanges = 
            currentFilters.search !== filters.search ||
            currentFilters.status !== filters.status;

        if (hasChanges) {
            router.get(route('passbook.index'), currentFilters, {
                preserveState: true,
                replace: true,
            });
        }
    }, [debouncedSearch, debouncedStatus]);

    const handleReset = (): void => {
        setSearch('');
        setStatus('all');
    };

    return (
        <AppLayout>
            <Head title="Member Passbooks" />
            <div className="py-6">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Member Passbooks</h1>
                            <p className="text-sm text-gray-600">View member transaction history and balances</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="search">Search Members</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="search"
                                            placeholder="Search by name or mobile..."
                                            className="pl-8"
                                            value={search}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 flex items-end">
                                    <Button variant="outline" onClick={handleReset} className="w-full">
                                        Clear Filters
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Members Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Members</CardTitle>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-sm text-gray-600">
                                    Showing {members.data.length} of {members.total} members
                                </p>
                                {debouncedSearch && (
                                    <Badge variant="secondary" className="flex items-center">
                                        <Search className="w-3 h-3 mr-1" />
                                        Searching: "{debouncedSearch}"
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Mobile</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.data.map((member: any) => (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{member.name}</div>
                                                    <div className="text-sm text-gray-500">{member.email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{member.mobile}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {member.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={member.nstatus ? 'default' : 'destructive'}>
                                                    {member.nstatus ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={route('passbook.show', member.id)}>
                                                        <BookOpen className="w-4 h-4 mr-1" />
                                                        View Passbook
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {members.data.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <div>No members found</div>
                                    {(debouncedSearch || status !== 'all') && (
                                        <Button variant="outline" onClick={handleReset} className="mt-4">
                                            Clear filters to see all members
                                        </Button>
                                    )}
                                </div>
                            )}
                            
                            {members.data.length > 0 && (
                                <div className="p-6 border-t">
                                    <InertiaPagination data={members} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}