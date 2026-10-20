// resources/js/Pages/Passbook/Schedule.tsx

import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    ArrowLeft,
    Download,
    Calendar,
    TrendingUp,
    TrendingDown,
    Wallet,
    FileText
} from 'lucide-react';
import type { PassbookScheduleProps } from '@/types/passbook';

export default function PassbookSchedule({ 
    member, 
    transactions, 
    monthlySummary, 
    availableYears, 
    availableMonths, 
    filters 
}: PassbookScheduleProps) {
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const handleFilterChange = (year: number, month: number) => {
        router.get(route('passbook.schedule', member.id), {
            year,
            month
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const getAccountTypeColor = (type: string) => {
        const colors: { [key: string]: string } = {
            'SHARES': 'bg-blue-100 text-blue-800',
            'SAVINGS': 'bg-green-100 text-green-800',
            'SSAVINGS': 'bg-purple-100 text-purple-800',
            'BUILDING': 'bg-orange-100 text-orange-800',
            'LOAN_INTEREST': 'bg-red-100 text-red-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AppLayout>
            <Head title={`Transaction Schedule - ${member.name}`} />
            <div className="py-6">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <Button variant="outline" asChild>
                                <Link href={route('passbook.show', member.id)}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Passbook
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Transaction Schedule</h1>
                                <p className="text-sm text-gray-600">
                                    All transactions for {member.name}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Badge variant={member.nstatus ? 'default' : 'destructive'}>
                                {member.nstatus ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                    </div>

                    {/* Month Filter */}
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select Month</label>
                                    <div className="flex space-x-2">
                                        <Select 
                                            value={filters.year.toString()} 
                                            onValueChange={(value) => handleFilterChange(parseInt(value), filters.month)}
                                        >
                                            <SelectTrigger className="w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableYears.map((year) => (
                                                    <SelectItem key={year} value={year.toString()}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select 
                                            value={filters.month.toString()} 
                                            onValueChange={(value) => handleFilterChange(filters.year, parseInt(value))}
                                        >
                                            <SelectTrigger className="w-40">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableMonths.map((month) => (
                                                    <SelectItem key={month.value} value={month.value.toString()}>
                                                        {month.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                        Showing {availableMonths.find(m => m.value === filters.month)?.name} {filters.year}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Monthly Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center">
                                    <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Payments</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatCurrency(monthlySummary.total_payments)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center">
                                    <TrendingDown className="h-8 w-8 text-red-500 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Deductions</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {formatCurrency(monthlySummary.total_withdrawals)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center">
                                    <Wallet className="h-8 w-8 text-blue-500 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Net Total</p>
                                        <p className={`text-2xl font-bold ${
                                            monthlySummary.net_total >= 0 ? 'text-blue-600' : 'text-red-600'
                                        }`}>
                                            {formatCurrency(monthlySummary.net_total)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center">
                                    <FileText className="h-8 w-8 text-purple-500 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Transactions</p>
                                        <p className="text-2xl font-bold text-purple-600">
                                            {monthlySummary.transaction_count}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Account Type Breakdown */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Account Summary</CardTitle>
                            <CardDescription>Breakdown by account type</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(monthlySummary.by_account).map(([accountType, data]) => (
                                    <div key={accountType} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge className={getAccountTypeColor(accountType)}>
                                                {accountType === 'SHARES' ? 'Shares' :
                                                 accountType === 'SAVINGS' ? 'Savings' :
                                                 accountType === 'SSAVINGS' ? 'Special Savings' :
                                                 accountType === 'BUILDING' ? 'Building Fund' :
                                                 accountType === 'LOAN_INTEREST' ? 'Loan Interest' : accountType}
                                            </Badge>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Payments:</span>
                                                <span className="text-green-600 font-medium">
                                                    {formatCurrency(data.payments)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Deductions:</span>
                                                <span className="text-red-600 font-medium">
                                                    {formatCurrency(data.withdrawals)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-t pt-1">
                                                <span className="text-gray-600 font-medium">Net:</span>
                                                <span className={`font-bold ${
                                                    (data.payments - data.withdrawals) >= 0 ? 'text-blue-600' : 'text-red-600'
                                                }`}>
                                                    {formatCurrency(data.payments - data.withdrawals)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Simple Transactions Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All Transactions</CardTitle>
                            <CardDescription>
                                {monthlySummary.transaction_count} transactions in {availableMonths.find(m => m.value === filters.month)?.name} {filters.year}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {transactions.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date & Time</TableHead>
                                                <TableHead>Account Type</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactions.map((transaction, index) => (
                                                <TableRow key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                                    <TableCell>
                                                        <div className="font-medium">{transaction.date}</div>
                                                        <div className="text-sm text-gray-500">{transaction.time}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={getAccountTypeColor(transaction.type)}>
                                                            {transaction.account_type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-xs">
                                                        {transaction.description}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge 
                                                            variant={transaction.transaction_type === 'Payment' ? 'default' : 'destructive'}
                                                            className={
                                                                transaction.transaction_type === 'Payment' 
                                                                    ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                                                                    : 'bg-red-100 text-red-800 hover:bg-red-100'
                                                            }
                                                        >
                                                            {transaction.transaction_type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        <span className={
                                                            transaction.transaction_type === 'Payment' 
                                                                ? 'text-green-600' 
                                                                : 'text-red-600'
                                                        }>
                                                            {transaction.transaction_type === 'Payment' ? '+' : '-'}
                                                            {formatCurrency(transaction.amount)}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <div>No transactions found for this period</div>
                                    <Button variant="outline" asChild className="mt-4">
                                        <Link href={route('passbook.show', member.id)}>
                                            Back to Monthly Summary
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}