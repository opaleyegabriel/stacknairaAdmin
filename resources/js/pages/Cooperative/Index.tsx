// components/cooperative-index.tsx
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
    AlertTriangle,
    CheckCircle,
    XCircle,
    Eye,
    Coins,
    PiggyBank,
    Wallet,
    CreditCard,
    Loader2,
    Building,
    TrendingUp,
    Target
} from 'lucide-react';
import type { CooperativeIndexProps, CooperativeFinancialSummary } from '@/types/cooperative';
import InertiaPagination from '@/components/inertia-pagination';

// Safe default values
const DEFAULT_COOPERATIVE_DATA: CooperativeFinancialSummary = {
    member: {
        id: 0,
        name: 'Unknown',
        mobile: 'Unknown',
        category: 'Unknown',
        nstatus: false,
    },
    obligations: {
        status: 'no_category',
        message: 'Data not available',
        months_owed: 0,
        total_owed: 0,
        amount_expected_to_have_paid: 0,
        amount_paid: 0,
        registration_status: 'unknown',
        payment_pattern_status: 'no_category',
        consistency_status: 'no_category',
        payment_status: {
            is_owing: false,
            can_pay: false,
            wallet_balance: 0,
            remaining_after_owing: 0,
        },
        calculation_details: {
            current_day: 0,
            registration_day: 0,
            is_registration_in_current_month: false,
            current_month_start: '',
            current_month_end: '',
        }
    },
    balances: {
        SHARES: 0,
        SAVINGS: 0,
        SSAVINGS: 0,
        WALLET: 0,
        BUILDING: 0,
    },
    total_assets: 0,
    payment_pattern: {
        status: 'no_category',
        payment_history: [],
        total_months: 0,
        paid_months: 0,
        owed_months: 0,
        completion_rate: 0
    },
    consistency: {
        status: 'no_category',
        current_streak: 0,
        required_months: 0,
        needed_for_very_consistent: 0,
        progress_percentage: 0,
        perfect_payments_count: 0,
        category_name: 'Unknown'
    }
};

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

export default function CooperativeIndex({ members, cooperativeData = [], categories, filters }: CooperativeIndexProps) {
    const [search, setSearch] = useState<string>(filters.search || '');
    const [category, setCategory] = useState<string>(filters.category || 'all');
    const [status, setStatus] = useState<string>(filters.status || 'all');
    const [registration, setRegistration] = useState<string>(filters.registration || 'all');

    // Debounced values
    const debouncedSearch = useDebounce(search, 500);
    const debouncedCategory = useDebounce(category, 300);
    const debouncedStatus = useDebounce(status, 300);
    const debouncedRegistration = useDebounce(registration, 300);

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    // Apply filters automatically when debounced values change
    useEffect(() => {
        const currentFilters = {
            search: debouncedSearch || undefined,
            category: debouncedCategory !== 'all' ? debouncedCategory : undefined,
            status: debouncedStatus !== 'all' ? debouncedStatus : undefined,
            registration: debouncedRegistration !== 'all' ? debouncedRegistration : undefined,
        };

        const hasChanges = 
            currentFilters.search !== filters.search ||
            currentFilters.category !== filters.category ||
            currentFilters.status !== filters.status ||
            currentFilters.registration !== filters.registration;

        if (hasChanges) {
            router.get(route('cooperative.index'), currentFilters, {
                preserveState: true,
                replace: true,
            });
        }
    }, [debouncedSearch, debouncedCategory, debouncedStatus, debouncedRegistration]);

    const handleReset = (): void => {
        setSearch('');
        setCategory('all');
        setStatus('all');
        setRegistration('all');
    };

    const getStatusBadge = (obligations: CooperativeFinancialSummary['obligations']): JSX.Element => {
        switch (obligations.status) {
            case 'not_registered':
                return (
                    <Badge variant="destructive" className="flex items-center">
                        <XCircle className="w-3 h-3 mr-1" />
                        Not Registered
                    </Badge>
                );
            case 'owing':
                return (
                    <Badge variant="outline" className="flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Owing
                    </Badge>
                );
            case 'up_to_date':
                return (
                    <Badge variant="default" className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Up to Date
                    </Badge>
                );
            case 'no_category':
                return <Badge variant="secondary">No Category</Badge>;
            case 'error':
                return (
                    <Badge variant="destructive" className="flex items-center">
                        <XCircle className="w-3 h-3 mr-1" />
                        Error
                    </Badge>
                );
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    const getPaymentPatternBadge = (status: string): JSX.Element => {
        const getVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
            switch (status) {
                case 'excellent':
                    return 'default';
                case 'moderate':
                    return 'outline';
                case 'fair':
                    return 'outline';
                case 'poor':
                case 'very_poor':
                    return 'destructive';
                case 'new_member':
                    return 'secondary';
                case 'not_registered':
                    return 'destructive';
                default:
                    return 'secondary';
            }
        };

        const getText = (status: string): string => {
            switch (status) {
                case 'excellent': return 'Excellent';
                case 'moderate': return 'Moderate';
                case 'fair': return 'Fair';
                case 'poor': return 'Poor';
                case 'very_poor': return 'Very Poor';
                case 'new_member': return 'New Member';
                case 'not_registered': return 'Not Registered';
                default: return 'Unknown';
            }
        };

        return (
            <Badge variant={getVariant(status)}>
                {getText(status)}
            </Badge>
        );
    };

    const getConsistencyBadge = (status: string, currentStreak: number, requiredMonths: number): JSX.Element => {
        const getVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
            switch (status) {
                case 'very_consistent':
                    return 'default';
                case 'moderately_consistent':
                    return 'outline';
                case 'fairly_consistent':
                    return 'outline';
                case 'inconsistent':
                    return 'destructive';
                case 'new_member':
                    return 'secondary';
                case 'not_registered':
                    return 'destructive';
                default:
                    return 'secondary';
            }
        };

        const getText = (status: string): string => {
            switch (status) {
                case 'very_consistent': return 'Very Consistent';
                case 'moderately_consistent': return 'Moderate';
                case 'fairly_consistent': return 'Fair';
                case 'inconsistent': return 'Inconsistent';
                case 'new_member': return 'New Member';
                case 'not_registered': return 'Not Registered';
                default: return 'Unknown';
            }
        };

        return (
            <div className="flex flex-col space-y-1">
                <Badge variant={getVariant(status)}>
                    {getText(status)}
                </Badge>
                {currentStreak > 0 && (
                    <div className="text-xs text-gray-500">
                        {currentStreak}/{requiredMonths} months
                    </div>
                )}
            </div>
        );
    };

    // Use safe cooperative data
    const safeCooperativeData = Array.isArray(cooperativeData) ? cooperativeData : [];
    
    // Show loading state if no data
    if (!members || !safeCooperativeData.length) {
        return (
            <AppLayout>
                <Head title="Cooperative Management" />
                <div className="py-6">
                    <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Cooperative Management</h1>
                                <p className="text-sm text-gray-600">Manage member cooperative obligations</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
                                <p className="text-gray-600">Loading cooperative data...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Cooperative Management" />
            <div className="py-6">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Cooperative Management</h1>
                            <p className="text-sm text-gray-600">Manage member cooperative obligations and consistency</p>
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
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                                <div className="space-y-2">
                                    <Label htmlFor="registration">Registration</Label>
                                    <Select value={registration} onValueChange={setRegistration}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="registered">Registered</SelectItem>
                                            <SelectItem value="not_registered">Not Registered</SelectItem>
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
                            <CardTitle>Cooperative Members</CardTitle>
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
                                        <TableHead>Status</TableHead>
                                        <TableHead>Payment Pattern</TableHead>
                                        <TableHead>Consistency</TableHead>
                                        <TableHead>Expected Amount</TableHead>
                                        <TableHead>Months Owed</TableHead>
                                        <TableHead>Total Owed</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {safeCooperativeData.map((data: CooperativeFinancialSummary, index: number) => {
                                        const member = members.data[index];
                                        // Use safe data with fallback
                                        const safeData = data || DEFAULT_COOPERATIVE_DATA;
                                        const { obligations, balances, payment_pattern, consistency } = safeData;

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
                                                    {getStatusBadge(obligations)}
                                                </TableCell>
                                                <TableCell>
                                                    {getPaymentPatternBadge(obligations.payment_pattern_status)}
                                                </TableCell>
                                                <TableCell>
                                                    {getConsistencyBadge(
                                                        obligations.consistency_status, 
                                                        consistency.current_streak, 
                                                        consistency.required_months
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {obligations.monthly_amount ? 
                                                        formatCurrency(obligations.monthly_amount) : 
                                                        'N/A'
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {obligations.months_owed || 0}
                                                </TableCell>
                                                <TableCell>
                                                    <div className={`font-semibold ${
                                                        obligations.total_owed > 0 ? 'text-red-600' : 'text-gray-600'
                                                    }`}>
                                                        {formatCurrency(obligations.total_owed)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1 text-xs">
                                                        <div className="flex items-center">
                                                            <Coins className="w-3 h-3 mr-1" />
                                                            Shares: {formatCurrency(balances.SHARES)}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <PiggyBank className="w-3 h-3 mr-1" />
                                                            Savings: {formatCurrency(balances.SAVINGS)}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Wallet className="w-3 h-3 mr-1" />
                                                            Wallet: {formatCurrency(balances.WALLET)}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={route('cooperative.show', member?.id)}>
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

                            {safeCooperativeData.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <div>No members found</div>
                                    {(debouncedSearch || category !== 'all' || status !== 'all' || registration !== 'all') && (
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