import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    Eye,
    DollarSign,
    Calendar,
    Phone,
    Users,
    UserCheck,
    UserX,
    CheckCircle,
    XCircle
} from 'lucide-react';
import InertiaPagination from '@/components/inertia-pagination';

// Debounce hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

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

// Safe default for cooperative data
const DEFAULT_COOPERATIVE_DATA = {
    obligations: {
        status: 'no_category',
        message: 'Data not available',
        months_owed: 0,
        total_owed: 0,
        amount_expected_to_have_paid: 0,
        amount_paid: 0,
    },
    balances: {
        SHARES: 0,
        SAVINGS: 0,
        SSAVINGS: 0,
        WALLET: 0,
        BUILDING: 0,
    }
};

export default function ReferralsIndex({ referredMembers, cooperativeData = [], filters, merchantMobile, statistics, registeredMobiles = [] }) {
    const [search, setSearch] = useState(filters.search || '');
    const [registration, setRegistration] = useState(filters.registration || 'all');

    // Debounced values
    const debouncedSearch = useDebounce(search, 500);
    const debouncedRegistration = useDebounce(registration, 300);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Apply filters automatically
    useEffect(() => {
        const currentFilters = {
            search: debouncedSearch || undefined,
            registration: debouncedRegistration !== 'all' ? debouncedRegistration : undefined,
        };

        const hasChanges = 
            currentFilters.search !== filters.search ||
            currentFilters.registration !== filters.registration;

        if (hasChanges) {
            router.get(route('referrals.index'), currentFilters, {
                preserveState: true,
                replace: true,
            });
        }
    }, [debouncedSearch, debouncedRegistration]);

    const handleReset = () => {
        setSearch('');
        setRegistration('all');
    };

    // Check if member is fully registered (exists in track_registration table)
    const isFullyRegistered = (member) => {
        return registeredMobiles.includes(member.mobile);
    };

    const getStatusBadge = (member) => {
        const isRegistered = isFullyRegistered(member);
        
        if (isRegistered) {
            return (
                <Badge variant="default" className="flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Fully Registered
                </Badge>
            );
        } else {
            return (
                <Badge variant="destructive" className="flex items-center">
                    <UserX className="w-3 h-3 mr-1" />
                    Not Registered
                </Badge>
            );
        }
    };

    const getCooperativeStatusBadge = (coopData) => {
        const data = coopData || DEFAULT_COOPERATIVE_DATA;
        const { obligations } = data;

        switch (obligations.status) {
            case 'not_registered':
                return <Badge variant="destructive">Not Registered</Badge>;
            case 'owing':
                return <Badge variant="outline">Owing</Badge>;
            case 'up_to_date':
                return <Badge variant="default">Up to Date</Badge>;
            case 'no_category':
                return <Badge variant="secondary">No Category</Badge>;
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    if (!merchantMobile) {
        return (
            <AppLayout>
                <Head title="My Referrals" />
                <div className="py-6">
                    <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="text-center py-12">
                            <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <h2 className="text-xl font-semibold text-gray-900">Unable to Load Referrals</h2>
                            <p className="text-gray-600 mt-2">We couldn't identify your merchant account.</p>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="My Referrals" />
            <div className="py-6">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Referred Members</h1>
                            <p className="text-sm text-gray-600">
                                Members you've referred to the cooperative
                            </p>
                        </div>
                        <Badge variant="outline" className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {merchantMobile}
                        </Badge>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <Users className="w-8 h-8 text-blue-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Referred</p>
                                        <p className="text-2xl font-bold text-gray-900">{statistics.total_referred}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <UserCheck className="w-8 h-8 text-green-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Fully Registered</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {referredMembers.data.filter(member => 
                                                isFullyRegistered(member)
                                            ).length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <DollarSign className="w-8 h-8 text-orange-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Commission Rate</p>
                                        <p className="text-2xl font-bold text-gray-900">₦500 each</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="search">Search Members</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="search"
                                            placeholder="Search by name or mobile..."
                                            className="pl-8"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="registration">Registration Status</Label>
                                    <Select value={registration} onValueChange={setRegistration}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="registered">Fully Registered</SelectItem>
                                            <SelectItem value="not_registered">Not Registered</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 flex items-end">
                                    <Button variant="outline" onClick={handleReset} className="flex-1">
                                        Clear Filters
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Referred Members Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Referred Members</CardTitle>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-sm text-gray-600">
                                    Showing {referredMembers.data.length} of {referredMembers.total} referred members
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
                                        <TableHead>Cooperative Status</TableHead>
                                        <TableHead>Total Owed</TableHead>
                                        <TableHead>Join Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {referredMembers.data.map((member, index) => {
                                        const coopData = cooperativeData[index] || DEFAULT_COOPERATIVE_DATA;
                                        
                                        return (
                                            <TableRow key={member.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{member.name}</div>
                                                        <div className="text-sm text-gray-500">{member.mobile}</div>
                                                        <div className="text-xs text-gray-400">{member.email}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {member.category || 'No Category'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(member)}
                                                </TableCell>
                                                <TableCell>
                                                    {getCooperativeStatusBadge(coopData)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className={`font-semibold ${
                                                        coopData.obligations.total_owed > 0 ? 'text-red-600' : 'text-gray-600'
                                                    }`}>
                                                        {formatCurrency(coopData.obligations.total_owed)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                        {formatDate(member.created_at)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={route('cooperative.show', member.id)}>
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

                            {referredMembers.data.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <div>No referred members found</div>
                                    {(debouncedSearch || registration !== 'all') && (
                                        <Button variant="outline" onClick={handleReset} className="mt-4">
                                            Clear filters to see all referred members
                                        </Button>
                                    )}
                                </div>
                            )}
                            
                            {/* Pagination */}
                            {referredMembers.data.length > 0 && (
                                <div className="p-6 border-t">
                                    <InertiaPagination data={referredMembers} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}