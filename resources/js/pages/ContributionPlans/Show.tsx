import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Target, CheckCircle, XCircle, Calendar, DollarSign, TrendingUp, Users, Wallet, CreditCard, Download, Loader2 } from 'lucide-react';
import type { ContributionPlanData, ContributionPlan } from '@/types/contribution-plans';

interface AjoContributionSummary {
    total_paid: number;
    total_withdrawn: number;
    net_balance: number;
    transactions?: any[];
}

interface ContributionPlansShowProps {
    member: any;
    contributionSummary: any;
    ajoSummary: AjoContributionSummary;
    allPlans: any[];
}

export default function ContributionPlansShow({ member, contributionSummary, ajoSummary, allPlans }: ContributionPlansShowProps) {
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
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

    const getPlanStatusBadge = (status: string): JSX.Element => {
        switch (status) {
            case 'ACTIVE':
                return (
                    <Badge variant="default" className="flex items-center">
                        <Target className="w-3 h-3 mr-1" />
                        Active
                    </Badge>
                );
            case 'COMPLETED':
                return (
                    <Badge variant="secondary" className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
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

    const getProgressColor = (percentage: number): string => {
        if (percentage >= 80) return 'bg-green-500';
        if (percentage >= 50) return 'bg-yellow-500';
        return 'bg-blue-500';
    };

    const getFrequencyBadge = (frequency: string): JSX.Element => {
        const frequencyColors: { [key: string]: string } = {
            'DAILY': 'bg-blue-100 text-blue-800',
            'WEEKLY': 'bg-green-100 text-green-800',
            'MONTHLY': 'bg-purple-100 text-purple-800',
        };

        return (
            <Badge variant="outline" className={frequencyColors[frequency] || 'bg-gray-100 text-gray-800'}>
                {frequency}
            </Badge>
        );
    };

    const getTransactionTypeBadge = (debit: number, credit: number): JSX.Element => {
        if (debit > 0) {
            return <Badge className="bg-green-100 text-green-800">Payment</Badge>;
        } else if (credit > 0) {
            return <Badge className="bg-red-100 text-red-800">Withdrawal</Badge>;
        } else {
            return <Badge variant="outline">Adjustment</Badge>;
        }
    };

    // Safe data handling
    const safeAjoSummary: AjoContributionSummary = ajoSummary || {
        total_paid: 0,
        total_withdrawn: 0,
        net_balance: 0,
        transactions: []
    };

    // Show loading state if no data
    if (!member || !contributionSummary) {
        return (
            <AppLayout>
                <Head title={`Contribution Plans - ${member?.name || 'Member'}`} />
                <div className="py-6">
                    <div className="px-4 mx-auto max-w-6xl sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('contribution-plans.index')}>
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Plans
                                    </Link>
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Contribution Plans</h1>
                                    <p className="text-sm text-gray-600">{member?.name || 'Member'}</p>
                                </div>
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
            <Head title={`Contribution Plans - ${member.name}`} />
            <div className="py-6">
                <div className="px-4 mx-auto max-w-6xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <Button variant="outline" asChild>
                                <Link href={route('contribution-plans.index')}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Plans
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Contribution Plans</h1>
                                <p className="text-sm text-gray-600">{member.name} - {member.mobile}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Badge variant={member.nstatus ? 'default' : 'destructive'}>
                                {member.nstatus ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline">
                                {member.category}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Summary Cards */}
                        <div className="lg:col-span-3">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                {/* Plan Summary Cards */}
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center">
                                            <Target className="w-8 h-8 text-blue-600" />
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-600">Active Plans</p>
                                                <p className="text-2xl font-bold">{contributionSummary.active_plans_count}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center">
                                            <CheckCircle className="w-8 h-8 text-green-600" />
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-600">Completed Plans</p>
                                                <p className="text-2xl font-bold">{contributionSummary.completed_plans_count}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                {/* AJO Contribution Cards */}
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center">
                                            <Wallet className="w-8 h-8 text-green-600" />
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                                                <p className="text-2xl font-bold text-green-600">
                                                    {formatCurrency(safeAjoSummary.total_paid)}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center">
                                            <CreditCard className="w-8 h-8 text-red-600" />
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-600">Total Withdrawn</p>
                                                <p className="text-2xl font-bold text-red-600">
                                                    {formatCurrency(safeAjoSummary.total_withdrawn)}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center">
                                            <DollarSign className="w-8 h-8 text-purple-600" />
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-600">Net Balance</p>
                                                <p className={`text-2xl font-bold ${
                                                    safeAjoSummary.net_balance > 0 ? 'text-purple-600' : 
                                                    safeAjoSummary.net_balance < 0 ? 'text-red-600' : 'text-gray-600'
                                                }`}>
                                                    {formatCurrency(safeAjoSummary.net_balance)}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* AJO Contributions Section */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <Wallet className="w-5 h-5 mr-2" />
                                            AJO Contributions (Actual Payments)
                                        </div>
                                        <Badge variant={
                                            safeAjoSummary.net_balance > 0 ? "default" : 
                                            safeAjoSummary.net_balance < 0 ? "destructive" : "outline"
                                        }>
                                            Balance: {formatCurrency(safeAjoSummary.net_balance)}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription>
                                        Actual AJO payments and withdrawals from balance system
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {formatCurrency(safeAjoSummary.total_paid)}
                                            </div>
                                            <div className="text-sm text-gray-600">Total Paid</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-red-600">
                                                {formatCurrency(safeAjoSummary.total_withdrawn)}
                                            </div>
                                            <div className="text-sm text-gray-600">Total Withdrawn</div>
                                        </div>
                                        <div className="text-center">
                                            <div className={`text-2xl font-bold ${
                                                safeAjoSummary.net_balance > 0 ? 'text-blue-600' : 
                                                safeAjoSummary.net_balance < 0 ? 'text-red-600' : 'text-gray-600'
                                            }`}>
                                                {formatCurrency(safeAjoSummary.net_balance)}
                                            </div>
                                            <div className="text-sm text-gray-600">Current Balance</div>
                                        </div>
                                    </div>

                                    {/* Transaction History */}
                                    <div>
                                        <h4 className="font-semibold mb-4 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Transaction History
                                        </h4>
                                        
                                        {safeAjoSummary.transactions && safeAjoSummary.transactions.length > 0 ? (
                                            <div className="border rounded-lg">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Date & Time</TableHead>
                                                            <TableHead>Type</TableHead>
                                                            <TableHead>Description</TableHead>
                                                            <TableHead className="text-right">Amount</TableHead>
                                                            <TableHead className="text-right">Balance</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {safeAjoSummary.transactions.map((transaction: any, index: number) => (
                                                            <TableRow key={index}>
                                                                <TableCell className="whitespace-nowrap">
                                                                    {formatDateTime(transaction.created_at)}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {getTransactionTypeBadge(transaction.debit, transaction.credit)}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {transaction.description || 'AJO Contribution'}
                                                                    {transaction.reference && (
                                                                        <div className="text-xs text-gray-500">
                                                                            Ref: {transaction.reference}
                                                                        </div>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right font-medium">
                                                                    {transaction.debit > 0 ? (
                                                                        <span className="text-green-600">
                                                                            +{formatCurrency(transaction.debit)}
                                                                        </span>
                                                                    ) : transaction.credit > 0 ? (
                                                                        <span className="text-red-600">
                                                                            -{formatCurrency(transaction.credit)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-600">
                                                                            {formatCurrency(0)}
                                                                        </span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right font-medium">
                                                                    {formatCurrency(transaction.balance || 0)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500 border rounded-lg">
                                                <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                <div>No AJO transaction history found</div>
                                                <div className="text-sm mt-2">
                                                    All AJO contributions will appear here from tbl_balances
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Active Plans & History */}
                        <div className="lg:col-span-1">
                            <div className="space-y-6">
                                {/* Active Plans */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Target className="w-5 h-5 mr-2" />
                                            Active Plans
                                        </CardTitle>
                                        <CardDescription>
                                            Current contribution plans
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {contributionSummary.active_plans && contributionSummary.active_plans.length > 0 ? (
                                            <div className="space-y-3">
                                                {contributionSummary.active_plans.map((plan: any, index: number) => (
                                                    <div key={index} className="p-3 border rounded-lg">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="font-semibold">
                                                                {formatCurrency(plan.amount)}
                                                            </div>
                                                            {getFrequencyBadge(plan.frequency)}
                                                        </div>
                                                        <div className="flex justify-between text-sm mb-2">
                                                            <span>Progress</span>
                                                            <span>{formatPercentage(plan.completion_percentage)}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                                            <div 
                                                                className={`h-2 rounded-full ${getProgressColor(plan.completion_percentage)}`}
                                                                style={{ width: `${plan.completion_percentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <div className="text-gray-600">Paid:</div>
                                                                <div>{formatCurrency(plan.total_contributions)}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-gray-600">Remaining:</div>
                                                                <div className="text-red-600">{formatCurrency(plan.remaining_amount)}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-gray-500">
                                                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <div className="text-sm">No active plans</div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* All Plans History */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Calendar className="w-5 h-5 mr-2" />
                                            Plan History
                                        </CardTitle>
                                        <CardDescription>
                                            All contribution plans
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {allPlans && allPlans.length > 0 ? (
                                            <div className="space-y-3">
                                                {allPlans.map((plan: any, index: number) => (
                                                    <div key={index} className="p-3 border rounded-lg">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="font-medium">{formatCurrency(plan.amount)}</div>
                                                                <div className="flex items-center space-x-2 mt-1">
                                                                    {getFrequencyBadge(plan.frequency)}
                                                                    {getPlanStatusBadge(plan.status)}
                                                                </div>
                                                            </div>
                                                            <div className="text-right text-sm">
                                                                <div className="text-gray-600">
                                                                    {plan.total_contributions ? formatCurrency(plan.total_contributions) : '₦0.00'}
                                                                </div>
                                                                {plan.completion_percentage && (
                                                                    <div className="text-gray-500">
                                                                        {formatPercentage(plan.completion_percentage)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {plan.start_date && (
                                                            <div className="mt-2 text-xs text-gray-500">
                                                                {formatDate(plan.start_date)}
                                                                {plan.end_date && ` - ${formatDate(plan.end_date)}`}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-gray-500">
                                                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <div className="text-sm">No plan history</div>
                                            </div>
                                        )}
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