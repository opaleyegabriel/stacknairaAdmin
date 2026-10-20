import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Users, Target, CheckCircle, XCircle, Calendar, DollarSign, TrendingUp, Wallet, CreditCard, UserCheck, Loader2 } from 'lucide-react';
import type { AjoGroup, GroupPerformance, GroupMember, GroupContribution, GroupPayout } from '@/types/ajo-groups';
import { route } from 'ziggy-js';

interface AjoGroupsShowProps {
    group: AjoGroup;
    performance: GroupPerformance;
    members: GroupMember[];
    contributions: GroupContribution[];
    payouts: GroupPayout[];
}

export default function AjoGroupsShow({ group, performance, members, contributions, payouts }: AjoGroupsShowProps) {
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
                month: 'long',
                day: 'numeric',
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    const formatDateTime = (date: string): string => {
        try {
            return new Date(date).toLocaleDateString('en-NG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid date';
        }
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

    const getMemberStatusBadge = (hasReceived: boolean, status: string): JSX.Element => {
        if (hasReceived) {
            return <Badge variant="secondary">Received</Badge>;
        } else if (status === 'active') {
            return <Badge variant="default">Active</Badge>;
        } else {
            return <Badge variant="outline">Pending</Badge>;
        }
    };

    // Safe data handling
    const safePerformance: GroupPerformance = performance || {
        total_expected: 0,
        total_contributions: 0,
        total_payouts: 0,
        group_balance: 0,
        completion_rate: 0,
        members_without_payout: 0,
        available_slots: 0
    };

    const safeMembers: GroupMember[] = Array.isArray(members) ? members : [];
    const safeContributions: GroupContribution[] = Array.isArray(contributions) ? contributions : [];
    const safePayouts: GroupPayout[] = Array.isArray(payouts) ? payouts : [];

    // Show loading state if no data
    if (!group) {
        return (
            <AppLayout>
                <Head title={`AJO Group - Loading`} />
                <div className="py-6">
                    <div className="px-4 mx-auto max-w-6xl sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('ajo-groups.index')}>
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Groups
                                    </Link>
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">AJO Group</h1>
                                    <p className="text-sm text-gray-600">Loading group details...</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
                                <p className="text-gray-600">Loading group data...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title={`AJO Group - ${group.group_name}`} />
            <div className="py-6">
                <div className="px-4 mx-auto max-w-6xl sm:px-6 lg:px-8">
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
                                <h1 className="text-2xl font-bold text-gray-900">{group.group_name}</h1>
                                <p className="text-sm text-gray-600">AJO Group Details</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {getStatusBadge(group.status)}
                            {getFrequencyBadge(group.frequency)}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Summary Cards */}
                        <div className="lg:col-span-3">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center">
                                            <Users className="w-8 h-8 text-blue-600" />
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-600">Members</p>
                                                <p className="text-2xl font-bold">{safeMembers.length} / {group.max_members}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center">
                                            <DollarSign className="w-8 h-8 text-green-600" />
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-600">Contributions</p>
                                                <p className="text-2xl font-bold text-green-600">
                                                    {formatCurrency(safePerformance.total_contributions)}
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
                                                <p className="text-sm font-medium text-gray-600">Payouts</p>
                                                <p className="text-2xl font-bold text-red-600">
                                                    {formatCurrency(safePerformance.total_payouts)}
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
                                                <p className="text-sm font-medium text-gray-600">Balance</p>
                                                <p className={`text-2xl font-bold ${
                                                    safePerformance.group_balance > 0 ? 'text-purple-600' : 
                                                    safePerformance.group_balance < 0 ? 'text-red-600' : 'text-gray-600'
                                                }`}>
                                                    {formatCurrency(safePerformance.group_balance)}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center">
                                            <Target className="w-8 h-8 text-orange-600" />
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-600">Completion</p>
                                                <p className="text-2xl font-bold text-orange-600">
                                                    {formatPercentage(safePerformance.completion_rate)}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-2">
                            <Tabs defaultValue="members" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="members">Members</TabsTrigger>
                                    <TabsTrigger value="contributions">Contributions</TabsTrigger>
                                    <TabsTrigger value="payouts">Payouts</TabsTrigger>
                                </TabsList>
                                
                                {/* Members Tab */}
                                <TabsContent value="members">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                <Users className="w-5 h-5 mr-2" />
                                                Group Members ({safeMembers.length})
                                            </CardTitle>
                                            <CardDescription>
                                                Current members of this AJO group
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {safeMembers.length > 0 ? (
                                                <div className="border rounded-lg">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Member</TableHead>
                                                                <TableHead>Status</TableHead>
                                                                <TableHead>Joined</TableHead>
                                                                <TableHead>Contributions</TableHead>
                                                                <TableHead>Payouts</TableHead>
                                                                <TableHead>Net Position</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {safeMembers.map((member, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell>
                                                                        <div>
                                                                            <div className="font-medium">
                                                                                {member.member?.name || 'Unknown Member'}
                                                                            </div>
                                                                            <div className="text-sm text-gray-500">
                                                                                {member.mobile}
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {getMemberStatusBadge(member.has_received, member.status)}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {formatDate(member.joined_at)}
                                                                    </TableCell>
                                                                    <TableCell className="text-green-600 font-medium">
                                                                        {formatCurrency(member.total_contributions)}
                                                                    </TableCell>
                                                                    <TableCell className="text-red-600 font-medium">
                                                                        {formatCurrency(member.total_payouts)}
                                                                    </TableCell>
                                                                    <TableCell className={`font-medium ${
                                                                        member.net_position > 0 ? 'text-blue-600' : 
                                                                        member.net_position < 0 ? 'text-orange-600' : 'text-gray-600'
                                                                    }`}>
                                                                        {formatCurrency(member.net_position)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                    <div>No members found in this group</div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Contributions Tab */}
                                <TabsContent value="contributions">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                <DollarSign className="w-5 h-5 mr-2" />
                                                Contributions ({safeContributions.length})
                                            </CardTitle>
                                            <CardDescription>
                                                All contributions made to this group
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {safeContributions.length > 0 ? (
                                                <div className="border rounded-lg">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Member</TableHead>
                                                                <TableHead>Amount</TableHead>
                                                                <TableHead>Date</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {safeContributions.map((contribution, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell>
                                                                        <div>
                                                                            <div className="font-medium">
                                                                                {contribution.member?.name || 'Unknown Member'}
                                                                            </div>
                                                                            <div className="text-sm text-gray-500">
                                                                                {contribution.mobile}
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-green-600 font-medium">
                                                                        {formatCurrency(contribution.amount)}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {formatDateTime(contribution.created_at)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                    <div>No contributions found for this group</div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Payouts Tab */}
                                <TabsContent value="payouts">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                <Wallet className="w-5 h-5 mr-2" />
                                                Payouts ({safePayouts.length})
                                            </CardTitle>
                                            <CardDescription>
                                                All payouts made from this group
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {safePayouts.length > 0 ? (
                                                <div className="border rounded-lg">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Receiver</TableHead>
                                                                <TableHead>Amount</TableHead>
                                                                <TableHead>Round</TableHead>
                                                                <TableHead>Date</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {safePayouts.map((payout, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell>
                                                                        <div>
                                                                            <div className="font-medium">
                                                                                {payout.receiver?.name || 'Unknown Member'}
                                                                            </div>
                                                                            <div className="text-sm text-gray-500">
                                                                                {payout.receiver_mobile}
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-red-600 font-medium">
                                                                        {formatCurrency(payout.amount)}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="outline">
                                                                            Round {payout.round_no}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {formatDateTime(payout.paid_at)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                    <div>No payouts found for this group</div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="space-y-6">
                                {/* Group Info */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <UserCheck className="w-5 h-5 mr-2" />
                                            Group Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <div className="text-sm font-medium text-gray-600">Group Name</div>
                                            <div className="font-semibold">{group.group_name}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-600">Contribution Amount</div>
                                            <div className="font-semibold text-green-600">
                                                {formatCurrency(group.amount)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-600">Frequency</div>
                                            <div>{getFrequencyBadge(group.frequency)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-600">Current Round</div>
                                            <div className="font-semibold">{group.current_round}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-600">Members Capacity</div>
                                            <div className="font-semibold">
                                                {safeMembers.length} / {group.max_members}
                                            </div>
                                        </div>
                                        {group.start_date && (
                                            <div>
                                                <div className="text-sm font-medium text-gray-600">Start Date</div>
                                                <div>{formatDate(group.start_date)}</div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Performance Summary */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <TrendingUp className="w-5 h-5 mr-2" />
                                            Performance
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <div className="text-sm font-medium text-gray-600">Completion Rate</div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full ${getProgressColor(safePerformance.completion_rate)}`}
                                                        style={{ width: `${Math.min(safePerformance.completion_rate, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-semibold">
                                                    {formatPercentage(safePerformance.completion_rate)}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-600">Pending Payouts</div>
                                            <div className="font-semibold">
                                                {safePerformance.members_without_payout} members
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-600">Available Slots</div>
                                            <div className="font-semibold">
                                                {safePerformance.available_slots} remaining
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-600">Expected Total</div>
                                            <div className="font-semibold">
                                                {formatCurrency(safePerformance.total_expected)}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}