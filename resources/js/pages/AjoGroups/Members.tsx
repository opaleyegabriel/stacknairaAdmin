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
    Users,
    Target,
    CheckCircle,
    XCircle,
    Eye,
    DollarSign,
    TrendingUp,
    Wallet,
    Loader2,
    Filter,
    ArrowLeft
} from 'lucide-react';
import type { MemberGroupData } from '@/types/ajo-groups';
import InertiaPagination from '@/components/inertia-pagination';

// Debounce hook
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

interface AjoGroupsMembersProps {
    members: any;
    groupAjoData: MemberGroupData[];
    categories: any[];
    filters: {
        search?: string;
        group_status?: string;
        category?: string;
    };
}

export default function AjoGroupsMembers({ members, groupAjoData = [], categories, filters }: AjoGroupsMembersProps) {
    const [search, setSearch] = useState<string>(filters.search || '');
    const [groupStatus, setGroupStatus] = useState<string>(filters.group_status || 'all');
    const [category, setCategory] = useState<string>(filters.category || 'all');
    const [isLoading, setIsLoading] = useState(false);

    // Debounced values
    const debouncedSearch = useDebounce(search, 500);
    const debouncedGroupStatus = useDebounce(groupStatus, 300);
    const debouncedCategory = useDebounce(category, 300);

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount || 0);
    };

    const formatPercentage = (percentage: number): string => {
        return `${percentage.toFixed(1)}%`;
    };
    
    // Apply filters automatically when debounced values change
    useEffect(() => {
        const currentFilters = {
            search: debouncedSearch || undefined,
            group_status: debouncedGroupStatus !== 'all' ? debouncedGroupStatus : undefined,
            category: debouncedCategory !== 'all' ? debouncedCategory : undefined,
        };

        const hasChanges = 
            currentFilters.search !== filters.search ||
            currentFilters.group_status !== filters.group_status ||
            currentFilters.category !== filters.category;

        if (hasChanges) {
            setIsLoading(true);
            router.get(route('ajo-groups.members'), currentFilters, {
                preserveState: true,
                replace: true,
                onFinish: () => setIsLoading(false),
            });
        }
    }, [debouncedSearch, debouncedGroupStatus, debouncedCategory]);

    const handleReset = (): void => {
        setSearch('');
        setGroupStatus('all');
        setCategory('all');
    };

    const getGroupStatusBadge = (hasGroups: boolean, groupsCount: number): JSX.Element => {
        if (hasGroups) {
            return (
                <Badge variant="default" className="flex items-center">
                    <Target className="w-3 h-3 mr-1" />
                    {groupsCount} Group(s)
                </Badge>
            );
        } else {
            return (
                <Badge variant="outline" className="flex items-center">
                    <XCircle className="w-3 h-3 mr-1" />
                    No Groups
                </Badge>
            );
        }
    };

    const getPositionBadge = (netPosition: number): JSX.Element => {
        if (netPosition > 0) {
            return (
                <Badge variant="default" className="flex items-center bg-green-100 text-green-800">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    In Profit
                </Badge>
            );
        } else if (netPosition < 0) {
            return (
                <Badge variant="destructive" className="flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    In Loss
                </Badge>
            );
        } else {
            return (
                <Badge variant="outline" className="flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Break Even
                </Badge>
            );
        }
    };

    // Use safe group AJO data
    const safeGroupAjoData = Array.isArray(groupAjoData) ? groupAjoData : [];
    
    // Calculate totals for summary
    const totals = safeGroupAjoData.reduce((acc, data) => {
        const summary = data.summary || { 
            total_group_contributions: 0, 
            total_group_payouts: 0, 
            net_group_position: 0,
            total_groups_count: 0
        };

        // Convert string values to numbers to prevent concatenation
        const contributions = typeof summary.total_group_contributions === 'string' 
            ? parseFloat(summary.total_group_contributions) || 0
            : summary.total_group_contributions || 0;
            
        const payouts = typeof summary.total_group_payouts === 'string'
            ? parseFloat(summary.total_group_payouts) || 0
            : summary.total_group_payouts || 0;
            
        const netPosition = typeof summary.net_group_position === 'string'
            ? parseFloat(summary.net_group_position) || 0
            : summary.net_group_position || 0;

        return {
            totalContributions: acc.totalContributions + contributions,
            totalPayouts: acc.totalPayouts + payouts,
            totalNetPosition: acc.totalNetPosition + netPosition,
            totalGroups: acc.totalGroups + summary.total_groups_count,
        };
    }, { 
        totalContributions: 0, 
        totalPayouts: 0, 
        totalNetPosition: 0, 
        totalGroups: 0 
    });

    // Show loading state if no data
    if (!members || !safeGroupAjoData.length) {
        return (
            <AppLayout>
                <Head title="AJO Groups - Members" />
                <div className="py-6">
                    <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('ajo-groups.index')}>
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Groups
                                    </Link>
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">AJO Group Members</h1>
                                    <p className="text-sm text-gray-600">Manage member participation in AJO groups</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
                                <p className="text-gray-600">Loading AJO groups member data...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="AJO Groups - Members" />
            <div className="py-6">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <Button variant="outline" asChild>
                                <Link href={route('ajo-groups.index')}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Groups
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">AJO Group Members</h1>
                                <p className="text-sm text-gray-600">Manage member participation in AJO groups</p>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <Users className="w-8 h-8 text-blue-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Groups</p>
                                        <p className="text-2xl font-bold">{totals.totalGroups}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <DollarSign className="w-8 h-8 text-green-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Contributions</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatCurrency(totals.totalContributions)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <Wallet className="w-8 h-8 text-red-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Payouts</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {formatCurrency(totals.totalPayouts)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <TrendingUp className="w-8 h-8 text-purple-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Net Position</p>
                                        <p className={`text-2xl font-bold ${
                                            totals.totalNetPosition > 0 ? 'text-purple-600' : 
                                            totals.totalNetPosition < 0 ? 'text-red-600' : 'text-gray-600'
                                        }`}>
                                            {formatCurrency(totals.totalNetPosition)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Filter className="w-5 h-5 mr-2" />
                                Filters
                            </CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                Filters are applied automatically as you type or select
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="search">Search Members</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="search"
                                            placeholder="Search by name, mobile..."
                                            className="pl-8"
                                            value={search}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="group_status">Group Status</Label>
                                    <Select value={groupStatus} onValueChange={setGroupStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Members" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Members</SelectItem>
                                            <SelectItem value="with_groups">With Groups</SelectItem>
                                            <SelectItem value="without_groups">Without Groups</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
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
                                <div className="space-y-2 flex items-end">
                                    <div className="flex space-x-2 w-full">
                                        <Button 
                                            variant="outline" 
                                            onClick={handleReset} 
                                            className="flex-1"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : null}
                                            Clear Filters
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Members Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>AJO Group Members Overview</CardTitle>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-sm text-gray-600">
                                    Showing {members.data.length} of {members.total} members
                                </p>
                                <div className="flex items-center space-x-2">
                                    {debouncedSearch && (
                                        <Badge variant="secondary" className="flex items-center">
                                            <Search className="w-3 h-3 mr-1" />
                                            Search: "{debouncedSearch}"
                                        </Badge>
                                    )}
                                    {groupStatus !== 'all' && (
                                        <Badge variant="secondary" className="flex items-center">
                                            <Filter className="w-3 h-3 mr-1" />
                                            Status: {groupStatus.replace('_', ' ')}
                                        </Badge>
                                    )}
                                    {category !== 'all' && (
                                        <Badge variant="secondary" className="flex items-center">
                                            <Users className="w-3 h-3 mr-1" />
                                            Category: {category}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative">
                            {isLoading && (
                                <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
                                    <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-lg">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                        <span className="text-sm text-gray-600">Applying filters...</span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[200px]">Member</TableHead>
                                            <TableHead className="w-[120px]">Category</TableHead>
                                            <TableHead className="w-[150px]">Group Status</TableHead>
                                            <TableHead className="w-[140px]">Total Groups</TableHead>
                                            <TableHead className="w-[140px]">Total Contributions</TableHead>
                                            <TableHead className="w-[140px]">Total Payouts</TableHead>
                                            <TableHead className="w-[140px]">Net Position</TableHead>
                                            <TableHead className="w-[120px]">Position Status</TableHead>
                                            <TableHead className="w-[100px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {safeGroupAjoData.map((data: MemberGroupData, index: number) => {
                                            const member = members.data[index];
                                            const { summary, groups } = data;

                                            return (
                                                <TableRow key={member?.id || index} className="hover:bg-gray-50">
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{member?.name || 'Unknown'}</div>
                                                            <div className="text-sm text-gray-500">{member?.mobile || 'N/A'}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {member?.category || 'N/A'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getGroupStatusBadge(summary.has_groups, summary.total_groups_count)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            <div className="font-semibold">{summary.total_groups_count} groups</div>
                                                            {groups.length > 0 && (
                                                                <div className="text-xs text-gray-500">
                                                                    {groups.filter(g => g.has_received).length} received payout
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-green-600">
                                                            {formatCurrency(summary.total_group_contributions)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-red-600">
                                                            {formatCurrency(summary.total_group_payouts)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className={`font-medium ${
                                                            summary.net_group_position > 0 ? 'text-blue-600' : 
                                                            summary.net_group_position < 0 ? 'text-red-600' : 'text-gray-600'
                                                        }`}>
                                                            {formatCurrency(summary.net_group_position)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getPositionBadge(summary.net_group_position)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="outline" size="sm" asChild className="w-full">
                                                            <Link href={route('members.show', member?.id)}>
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                View
                                                            </Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {safeGroupAjoData.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <div className="text-lg font-medium mb-2">No members found</div>
                                    <div className="text-sm mb-4">
                                        {debouncedSearch || groupStatus !== 'all' || category !== 'all' 
                                            ? "Try adjusting your filters to see more results"
                                            : "No members with AJO group activities found"
                                        }
                                    </div>
                                    {(debouncedSearch || groupStatus !== 'all' || category !== 'all') && (
                                        <Button variant="outline" onClick={handleReset}>
                                            Clear all filters
                                        </Button>
                                    )}
                                </div>
                            )}
                            
                            {/* Pagination */}
                            {members.data.length > 0 && (
                                <div className="mt-6">
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