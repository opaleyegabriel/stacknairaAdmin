// resources/js/Pages/AccumulationPassbook/Index.tsx

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
    Target,
    Eye,
    TrendingUp
} from 'lucide-react';
import type { AccumulationPassbookIndexProps } from '@/types/accumulation-passbook';
import InertiaPagination from '@/components/inertia-pagination';

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function AccumulationPassbookIndex({ members, categories, filters }: AccumulationPassbookIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || 'all');
    const [status, setStatus] = useState(filters.status || 'all');

    const debouncedSearch = useDebounce(search, 500);
    const debouncedCategory = useDebounce(category, 300);
    const debouncedStatus = useDebounce(status, 300);

    useEffect(() => {
        const currentFilters = {
            search: debouncedSearch || undefined,
            category: debouncedCategory !== 'all' ? debouncedCategory : undefined,
            status: debouncedStatus !== 'all' ? debouncedStatus : undefined,
        };

        const hasChanges = 
            currentFilters.search !== filters.search ||
            currentFilters.category !== filters.category ||
            currentFilters.status !== filters.status;

        if (hasChanges) {
            router.get(route('accumulation-passbook.index'), currentFilters, {
                preserveState: true,
                replace: true,
            });
        }
    }, [debouncedSearch, debouncedCategory, debouncedStatus]);

    const handleReset = () => {
        setSearch('');
        setCategory('all');
        setStatus('all');
    };

    return (
        <AppLayout>
            <Head title="Accumulation Passbook" />
            <div className="py-6">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Accumulation Passbook</h1>
                            <p className="text-sm text-gray-600">Track member payments against category targets</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Search Members</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by name or mobile..."
                                            className="pl-8"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.name}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
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
                                        <TableHead>Category</TableHead>
                                        <TableHead>Monthly Target</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.data.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{member.name}</div>
                                                    <div className="text-sm text-gray-500">{member.mobile}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {member.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {member.category_details ? (
                                                    <div className="font-medium">
                                                        ₦{(member.category_details.dailyMin * 30).toLocaleString()}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">No category</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={member.nstatus ? 'default' : 'destructive'}>
                                                    {member.nstatus ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={route('accumulation-passbook.show', member.id)}>
                                                        <Target className="w-4 h-4 mr-1" />
                                                        View Accumulation
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
                                    {(debouncedSearch || category !== 'all' || status !== 'all') && (
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