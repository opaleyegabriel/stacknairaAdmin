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
    CheckCircle,
    XCircle,
    Eye,
    Calendar,
    DollarSign,
    TrendingUp,
    Wallet,
    Loader2
} from 'lucide-react';
import type { ContributionPlansIndexProps, ContributionPlanData } from '@/types/contribution-plans';
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

export default function ContributionPlansIndex({ members, contributionData = [], categories, filters }: ContributionPlansIndexProps) {
    const [search, setSearch] = useState<string>(filters.search || '');
    const [planStatus, setPlanStatus] = useState<string>(filters.plan_status || 'all');
    const [category, setCategory] = useState<string>(filters.category || 'all');

    // Debounced values
    const debouncedSearch = useDebounce(search, 500);
    const debouncedPlanStatus = useDebounce(planStatus, 300);
    const debouncedCategory = useDebounce(category, 300);

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount || 0);
    };

    const formatPercentage = (percentage: number): string => {
        return `${percentage.toFixed(1)}%`;
    };
    
    // Apply filters automatically when debounced values change
    useEffect(() => {
        const currentFilters = {
            search: debouncedSearch || undefined,
            plan_status: debouncedPlanStatus !== 'all' ? debouncedPlanStatus : undefined,
            category: debouncedCategory !== 'all' ? debouncedCategory : undefined,
        };

        const hasChanges = 
            currentFilters.search !== filters.search ||
            currentFilters.plan_status !== filters.plan_status ||
            currentFilters.category !== filters.category;

        if (hasChanges) {
            router.get(route('contribution-plans.index'), currentFilters, {
                preserveState: true,
                replace: true,
            });
        }
    }, [debouncedSearch, debouncedPlanStatus, debouncedCategory]);

    const handleReset = (): void => {
        setSearch('');
        setPlanStatus('all');
        setCategory('all');
    };

    const getPlanStatusBadge = (hasActivePlans: boolean, activePlansCount: number): JSX.Element => {
        if (hasActivePlans) {
            return (
                <Badge variant="default" className="flex items-center">
                    <Target className="w-3 h-3 mr-1" />
                    {activePlansCount} Active Plan(s)
                </Badge>
            );
        } else {
            return (
                <Badge variant="outline" className="flex items-center">
                    <XCircle className="w-3 h-3 mr-1" />
                    No Active Plans
                </Badge>
            );
        }
    };

    const getProgressColor = (percentage: number): string => {
        if (percentage >= 80) return 'bg-green-500';
        if (percentage >= 50) return 'bg-yellow-500';
        return 'bg-blue-500';
    };

    const getAjoStatusBadge = (netBalance: number): JSX.Element => {
        if (netBalance > 0) {
            return (
                <Badge variant="default" className="flex items-center bg-green-100 text-green-800">
                    <Wallet className="w-3 h-3 mr-1" />
                    Active Balance
                </Badge>
            );
        } else {
            return (
                <Badge variant="outline" className="flex items-center">
                    <Wallet className="w-3 h-3 mr-1" />
                    No Balance
                </Badge>
            );
        }
    };

    // Use safe contribution data
    const safeContributionData = Array.isArray(contributionData) ? contributionData : [];
    
    // Show loading state if no data
    if (!members || !safeContributionData.length) {
        return (
            <AppLayout>
                <Head title="Contribution Plans" />
                <div className="py-6">
                    <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Contribution Plans</h1>
                                <p className="text-sm text-gray-600">Manage member AJO contribution plans</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
                                <p className="text-gray-600">Loading contribution plans data...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Contribution Plans" />
            <div className="py-6">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Contribution Plans</h1>
                            <p className="text-sm text-gray-600">Manage member AJO contribution plans and track payments</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                Filters are applied automatically as you type or select
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="search">Search</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="search"
                                            placeholder="Search members..."
                                            className="pl-8"
                                            value={search}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="plan_status">Plan Status</Label>
                                    <Select value={planStatus} onValueChange={setPlanStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Members</SelectItem>
                                            <SelectItem value="with_plans">With Active Plans</SelectItem>
                                            <SelectItem value="without_plans">Without Active Plans</SelectItem>
                                            <SelectItem value="with_completed">With Completed Plans</SelectItem>
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
                                    <div className="flex space-x-2">
                                        <Button variant="outline" onClick={handleReset} className="flex-1">
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
                            <CardTitle>Contribution Plans Overview</CardTitle>
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
                                        <TableHead>Plan Status</TableHead>
                                        <TableHead>AJO Status</TableHead>
                                        <TableHead>Amount Paid</TableHead>
                                        <TableHead>Net Balance</TableHead>
                                        <TableHead>Active Plans</TableHead>
                                        <TableHead>Plan Progress</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {safeContributionData.map((data: ContributionPlanData, index: number) => {
                                        const member = members.data[index];
                                        const { summary, contribution_plans, ajo_contributions } = data;
                                        
                                        // Get AJO contribution data safely
                                        const ajoData = ajo_contributions || {
                                            total_paid: 0,
                                            total_withdrawn: 0,
                                            net_balance: 0
                                        };

                                        return (
                                            <TableRow key={member?.id || index}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{member?.name || 'Unknown'}</div>
                                                        <div className="text-sm text-gray-500">{member?.mobile || 'N/A'}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {member?.category || 'N/A'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {getPlanStatusBadge(summary.has_active_plans, summary.active_plans_count)}
                                                </TableCell>
                                                <TableCell>
                                                    {getAjoStatusBadge(ajoData.net_balance)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-green-600">
                                                            {formatCurrency(ajoData.total_paid)}
                                                        </div>
                                                        {ajoData.total_withdrawn > 0 && (
                                                            <div className="text-xs text-gray-500">
                                                                Withdrawn: {formatCurrency(ajoData.total_withdrawn)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className={`font-medium ${
                                                        ajoData.net_balance > 0 ? 'text-blue-600' : 
                                                        ajoData.net_balance < 0 ? 'text-red-600' : 'text-gray-600'
                                                    }`}>
                                                        {formatCurrency(ajoData.net_balance)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {summary.active_plans_count} active
                                                        {summary.completed_plans_count > 0 && (
                                                            <div className="text-xs text-gray-500">
                                                                {summary.completed_plans_count} completed
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {contribution_plans.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {contribution_plans.map((plan, planIndex) => (
                                                                <div key={planIndex} className="text-xs">
                                                                    <div className="flex justify-between mb-1">
                                                                        <span>{formatCurrency(plan.amount)}</span>
                                                                        <span>{formatPercentage(plan.completion_percentage)}</span>
                                                                    </div>
                                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                                        <div 
                                                                            className={`h-2 rounded-full ${getProgressColor(plan.completion_percentage)}`}
                                                                            style={{ width: `${plan.completion_percentage}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-500">No active plans</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={route('contribution-plans.show', member?.id)}>
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

                            {safeContributionData.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <div>No members found with contribution plans</div>
                                    {(debouncedSearch || planStatus !== 'all' || category !== 'all') && (
                                        <Button variant="outline" onClick={handleReset} className="mt-4">
                                            Clear filters to see all members
                                        </Button>
                                    )}
                                </div>
                            )}
                            
                            {/* pagination controls */}
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