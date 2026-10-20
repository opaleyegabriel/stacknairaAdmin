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
    Calendar,
    DollarSign,
    TrendingUp,
    Wallet,
    Loader2,
    Filter,
    UserCheck
} from 'lucide-react';
import type { AjoGroupsIndexProps, GroupData } from '@/types/ajo-groups';
import InertiaPagination from '@/components/inertia-pagination';
import { access } from 'fs';

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

export default function AjoGroupsIndex({ groups, performanceData = [], filters }: AjoGroupsIndexProps) {
    const [search, setSearch] = useState<string>(filters.search || '');
    const [status, setStatus] = useState<string>(filters.status || 'all');
    const [frequency, setFrequency] = useState<string>(filters.frequency || 'all');
    const [isLoading, setIsLoading] = useState(false);

    // Debounced values
    const debouncedSearch = useDebounce(search, 500);
    const debouncedStatus = useDebounce(status, 300);
    const debouncedFrequency = useDebounce(frequency, 300);

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

    const formatDate = (date: string): string => {
        try {
            return new Date(date).toLocaleDateString('en-NG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch (error) {
            return 'Invalid date';
        }
    };
    
    // Apply filters automatically when debounced values change
    useEffect(() => {
        const currentFilters = {
            search: debouncedSearch || undefined,
            status: debouncedStatus !== 'all' ? debouncedStatus : undefined,
            frequency: debouncedFrequency !== 'all' ? debouncedFrequency : undefined,
        };

        const hasChanges = 
            currentFilters.search !== filters.search ||
            currentFilters.status !== filters.status ||
            currentFilters.frequency !== filters.frequency;

        if (hasChanges) {
            setIsLoading(true);
            router.get(route('ajo-groups.index'), currentFilters, {
                preserveState: true,
                replace: true,
                onFinish: () => setIsLoading(false),
            });
        }
    }, [debouncedSearch, debouncedStatus, debouncedFrequency]);

    const handleReset = (): void => {
        setSearch('');
        setStatus('all');
        setFrequency('all');
    };

    const getStatusBadge = (status: string): JSX.Element => {
        switch (status) {
            case 'active':
                return (
                    <Badge variant="default" className="flex items-center">
                        <Target className="w-3 h-3 mr-1" />
                        Active
                    </Badge>
                );
            case 'completed':
                return (
                    <Badge variant="secondary" className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge variant="outline" className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Pending
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="flex items-center">
                        <XCircle className="w-3 h-3 mr-1" />
                        {status}
                    </Badge>
                );
        }
    };

    const getFrequencyBadge = (frequency: string): JSX.Element => {
        const frequencyColors: { [key: string]: string } = {
            'daily': 'bg-blue-100 text-blue-800',
            'weekly': 'bg-green-100 text-green-800',
            'monthly': 'bg-purple-100 text-purple-800',
            'bi-weekly': 'bg-orange-100 text-orange-800',
        };

        return (
            <Badge variant="outline" className={frequencyColors[frequency] || 'bg-gray-100 text-gray-800'}>
                {frequency?.charAt(0).toUpperCase() + frequency?.slice(1) || 'N/A'}
            </Badge>
        );
    };

    const getProgressColor = (percentage: number): string => {
        if (percentage >= 80) return 'bg-green-500';
        if (percentage >= 50) return 'bg-yellow-500';
        return 'bg-blue-500';
    };

    // Use safe performance data
    const safePerformanceData = Array.isArray(performanceData) ? performanceData : [];
    
    // Calculate totals for summary
    // const totals = safePerformanceData.reduce((acc, data) => {
    //     const performance = data.performance || { total_contributions: 0, total_payouts: 0, group_balance: 0 };
    //         console.log(acc.total_contributions + ' performance:' + performance.total_contributions);
    //     console.log(acc);
    //     return {
    //         totalContributions: acc.totalContributions + performance.total_contributions,
    //         totalPayouts: acc.totalPayouts + performance.total_payouts,
    //         totalBalance: acc.totalBalance + performance.group_balance,
    //         totalGroups: acc.totalGroups + 1,
    //     };
    // }, { totalContributions: 0, totalPayouts: 0, totalBalance: 0, totalGroups: 0 });
    // Calculate totals for summary
    const totals = safePerformanceData.reduce((acc, data) => {
        const performance = data.performance || { total_contributions: 0, total_payouts: 0, group_balance: 0 };
        
        // Convert string values to numbers before adding
        const contributions = typeof performance.total_contributions === 'string' 
            ? parseFloat(performance.total_contributions) || 0
            : performance.total_contributions || 0;
        
        const payouts = typeof performance.total_payouts === 'string' 
            ? parseFloat(performance.total_payouts) || 0
            : performance.total_payouts || 0;
        
        const balance = typeof performance.group_balance === 'string'
            ? parseFloat(performance.group_balance) || 0
            : performance.group_balance || 0;

        return {
            totalContributions: acc.totalContributions + contributions,
            totalPayouts: acc.totalPayouts + payouts,
            totalBalance: acc.totalBalance + balance,
            totalGroups: acc.totalGroups + 1,
        };
    }, { totalContributions: 0, totalPayouts: 0, totalBalance: 0, totalGroups: 0 });
    // Show loading state if no data
    if (!groups || !safePerformanceData.length) {
        return (
            <AppLayout>
                <Head title="AJO Groups" />
                <div className="py-6">
                    <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">AJO Groups</h1>
                                <p className="text-sm text-gray-600">Manage rotating savings groups</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
                                <p className="text-gray-600">Loading AJO groups data...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="AJO Groups" />
            <div className="py-6">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">AJO Groups</h1>
                            <p className="text-sm text-gray-600">Manage rotating savings groups and track contributions</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" asChild>
                                <Link href={route('ajo-groups.members')}>
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    View Members
                                </Link>
                            </Button>
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
                                        <p className="text-sm font-medium text-gray-600">Net Balance</p>
                                        <p className={`text-2xl font-bold ${
                                            totals.totalBalance > 0 ? 'text-purple-600' : 
                                            totals.totalBalance < 0 ? 'text-red-600' : 'text-gray-600'
                                        }`}>
                                            {formatCurrency(totals.totalBalance)}
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
                                    <Label htmlFor="search">Search Groups</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="search"
                                            placeholder="Search by group name, amount..."
                                            className="pl-8"
                                            value={search}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Group Status</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="frequency">Frequency</Label>
                                    <Select value={frequency} onValueChange={setFrequency}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Frequencies" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Frequencies</SelectItem>
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
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

                    {/* Groups Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>AJO Groups Overview</CardTitle>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-sm text-gray-600">
                                    Showing {groups.data.length} of {groups.total} groups
                                </p>
                                <div className="flex items-center space-x-2">
                                    {debouncedSearch && (
                                        <Badge variant="secondary" className="flex items-center">
                                            <Search className="w-3 h-3 mr-1" />
                                            Search: "{debouncedSearch}"
                                        </Badge>
                                    )}
                                    {status !== 'all' && (
                                        <Badge variant="secondary" className="flex items-center">
                                            <Filter className="w-3 h-3 mr-1" />
                                            Status: {status}
                                        </Badge>
                                    )}
                                    {frequency !== 'all' && (
                                        <Badge variant="secondary" className="flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            Frequency: {frequency}
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
                                            <TableHead className="w-[200px]">Group Name</TableHead>
                                            <TableHead className="w-[120px]">Amount</TableHead>
                                            <TableHead className="w-[120px]">Frequency</TableHead>
                                            <TableHead className="w-[100px]">Status</TableHead>
                                            <TableHead className="w-[100px]">Round</TableHead>
                                            <TableHead className="w-[120px]">Members</TableHead>
                                            <TableHead className="w-[150px]">Performance</TableHead>
                                            <TableHead className="w-[150px]">Completion</TableHead>
                                            <TableHead className="w-[120px]">Balance</TableHead>
                                            <TableHead className="w-[100px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {safePerformanceData.map((data: GroupData, index: number) => {
                                            const group = groups.data[index];
                                            const performance = data.performance || { 
                                                completion_rate: 0, 
                                                group_balance: 0,
                                                total_contributions: 0,
                                                total_payouts: 0,
                                                members_without_payout: 0,
                                                available_slots: 0
                                            };

                                            return (
                                                <TableRow key={group?.id || index} className="hover:bg-gray-50">
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{group?.group_name || 'Unknown Group'}</div>
                                                            {group?.start_date && (
                                                                <div className="text-sm text-gray-500">
                                                                    Started: {formatDate(group.start_date)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-semibold">
                                                            {formatCurrency(group?.amount || 0)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getFrequencyBadge(group?.frequency)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(group?.status)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-center font-semibold">
                                                            {group?.current_round || 0}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            <div className="font-semibold">{data.members_count || 0} / {group?.max_members || 0}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {performance.available_slots || 0} slots available
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1 text-sm">
                                                            <div className="flex justify-between">
                                                                <span>Contributions:</span>
                                                                <span className="font-medium text-green-600">
                                                                    {formatCurrency(performance.total_contributions)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Payouts:</span>
                                                                <span className="font-medium text-red-600">
                                                                    {formatCurrency(performance.total_payouts)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between text-xs text-gray-500">
                                                                <span>Pending:</span>
                                                                <span>{performance.members_without_payout} members</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-sm mb-1">
                                                                <span>Progress</span>
                                                                <span className="font-semibold">
                                                                    {formatPercentage(performance.completion_rate)}
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div 
                                                                    className={`h-2 rounded-full ${getProgressColor(performance.completion_rate)}`}
                                                                    style={{ width: `${Math.min(performance.completion_rate, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className={`font-semibold ${
                                                            performance.group_balance > 0 ? 'text-green-600' : 
                                                            performance.group_balance < 0 ? 'text-red-600' : 'text-gray-600'
                                                        }`}>
                                                            {formatCurrency(performance.group_balance)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="outline" size="sm" asChild className="w-full">
                                                            <Link href={route('ajo-groups.show', group?.id)}>
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

                            {safePerformanceData.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <div className="text-lg font-medium mb-2">No AJO groups found</div>
                                    <div className="text-sm mb-4">
                                        {debouncedSearch || status !== 'all' || frequency !== 'all' 
                                            ? "Try adjusting your filters to see more results"
                                            : "No AJO groups found in the system"
                                        }
                                    </div>
                                    {(debouncedSearch || status !== 'all' || frequency !== 'all') && (
                                        <Button variant="outline" onClick={handleReset}>
                                            Clear all filters
                                        </Button>
                                    )}
                                </div>
                            )}
                            
                            {/* Pagination */}
                            {groups.data.length > 0 && (
                                <div className="mt-6">
                                    <InertiaPagination data={groups} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}