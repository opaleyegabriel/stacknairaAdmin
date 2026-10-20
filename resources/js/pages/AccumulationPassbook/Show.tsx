// resources/js/Pages/AccumulationPassbook/Show.tsx

import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    FileText,
    Calendar,
    AlertTriangle,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { route } from 'ziggy-js';

interface AccumulationPassbookShowProps {
    member?: any;
    passbookEntries?: any[];
    finalBalances?: any;
    summary?: any;
    category?: any;
    monthlyTarget?: number;
    error?: string;
    canView: boolean;
}

export default function AccumulationPassbookShow({ 
    member, 
    passbookEntries = [], 
    finalBalances = {}, 
    summary = {}, 
    category, 
    monthlyTarget = 0,
    error,
    canView 
}: AccumulationPassbookShowProps) {
    const formatCurrency = (amount: number): string => {
        if (amount === 0) return '-';
        return new Intl.NumberFormat('en-NG', {
            minimumFractionDigits: 2,
        }).format(amount);
    };

    // Calculate total monthly amount for the year (excluding opening balance)
    const totalYearlyAmount = passbookEntries
        .filter(entry => !entry.is_opening_balance)
        .reduce((sum, entry) => sum + entry.monthly_total, 0);

    // Error State - Cannot view at all
    if (!canView || !member) {
        return (
            <AppLayout>
                <Head title="Unable to View Accumulation" />
                <div className="py-6">
                    <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="flex items-center mb-6">
                            <Button variant="outline" asChild>
                                <Link href={route('accumulation-passbook.index')}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Members
                                </Link>
                            </Button>
                        </div>

                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <FileText className="w-16 h-16 text-red-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                                        Unable to View Accumulation
                                    </h3>
                                    <p className="text-red-600 mb-4">
                                        {error || 'This member cannot be viewed in the accumulation passbook.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const hasData = passbookEntries && passbookEntries.length > 0;
    const hasError = !!error;
    const handleExport = () => {
        // Create a hidden link to trigger the download
        const link = document.createElement('a');
        link.href = route('accumulation-passbook.export', {
            id: member.id
        });
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return (
        <AppLayout>
            <Head title={`Accumulation Passbook - ${member.name}`} />
            <div className="py-6">
                <div className="px-4 mx-auto max-w-8xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <Button variant="outline" asChild>
                                <Link href={route('accumulation-passbook.index')}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Members
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Accumulation Passbook</h1>
                                <p className="text-sm text-gray-600">
                                    {member.name} - {member.mobile}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Badge variant={member.nstatus ? 'default' : 'destructive'}>
                                {member.nstatus ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline">
                                {member.category}
                            </Badge>
                            <Button variant="outline" size="sm" onClick={handleExport}>
                                <Download className="w-4 h-4 mr-1" />
                                Export PDF
                            </Button>
                        </div>
                    </div>

                    {/* Summary Alert */}
                    {hasData && summary.months_owing > 0 && (
                        <Card className="mb-6 border-red-200 bg-red-50">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
                                        <div>
                                            <p className="font-medium text-red-800">
                                                Accumulation Stopped - Member Owing {summary.months_owing} Month(s)
                                            </p>
                                            <p className="text-sm text-red-600 mt-1">
                                                Total paid: {formatCurrency(summary.total_payments || 0)} | 
                                                Monthly target: {formatCurrency(monthlyTarget)} | 
                                                Amount owed: {formatCurrency(summary.total_owed || 0)}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="destructive" className="text-sm">
                                        PAYMENT REQUIRED
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Error Message */}
                    {hasError && (
                        <Card className="mb-6 border-yellow-200 bg-yellow-50">
                            <CardContent className="pt-6">
                                <div className="flex items-center">
                                    <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3" />
                                    <div>
                                        <p className="text-yellow-800">{error}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Passbook Table - EXACT SAME STRUCTURE as regular passbook */}
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead 
                                                rowSpan={2} 
                                                className="text-center border-r font-bold bg-gray-100"
                                                style={{ minWidth: '120px' }}
                                            >
                                                Date/Month
                                            </TableHead>
                                            <TableHead 
                                                colSpan={3} 
                                                className="text-center border-r font-bold bg-blue-100"
                                            >
                                                SHARES
                                            </TableHead>
                                            <TableHead 
                                                colSpan={3} 
                                                className="text-center border-r font-bold bg-green-100"
                                            >
                                                SAVINGS
                                            </TableHead>
                                            <TableHead 
                                                colSpan={3} 
                                                className="text-center border-r font-bold bg-purple-100"
                                            >
                                                SPECIAL SAVINGS
                                            </TableHead>
                                            <TableHead 
                                                colSpan={3} 
                                                className="text-center border-r font-bold bg-orange-100"
                                            >
                                                BUILDING FUND
                                            </TableHead>
                                            <TableHead 
                                                colSpan={3} 
                                                className="text-center border-r font-bold bg-red-100"
                                            >
                                                LOAN INTEREST
                                            </TableHead>
                                            <TableHead 
                                                rowSpan={2} 
                                                className="text-center border-r font-bold bg-teal-100"
                                            >
                                                MONTHLY TOTAL
                                            </TableHead>
                                            <TableHead 
                                                rowSpan={2} 
                                                className="text-center font-bold bg-indigo-100"
                                            >
                                                FINAL BALANCE
                                            </TableHead>
                                        </TableRow>
                                        <TableRow>
                                            {/* Shares Sub-headers */}
                                            <TableHead className="text-center bg-blue-50 border-r font-medium">Dr.</TableHead>
                                            <TableHead className="text-center bg-blue-50 border-r font-medium">Cr.</TableHead>
                                            <TableHead className="text-center bg-blue-50 border-r font-medium">Balance</TableHead>
                                            
                                            {/* Savings Sub-headers */}
                                            <TableHead className="text-center bg-green-50 border-r font-medium">Dr.</TableHead>
                                            <TableHead className="text-center bg-green-50 border-r font-medium">Cr.</TableHead>
                                            <TableHead className="text-center bg-green-50 border-r font-medium">Balance</TableHead>
                                            
                                            {/* Special Savings Sub-headers */}
                                            <TableHead className="text-center bg-purple-50 border-r font-medium">Dr.</TableHead>
                                            <TableHead className="text-center bg-purple-50 border-r font-medium">Cr.</TableHead>
                                            <TableHead className="text-center bg-purple-50 border-r font-medium">Balance</TableHead>
                                            
                                            {/* Building Fund Sub-headers */}
                                            <TableHead className="text-center bg-orange-50 border-r font-medium">Dr.</TableHead>
                                            <TableHead className="text-center bg-orange-50 border-r font-medium">Cr.</TableHead>
                                            <TableHead className="text-center bg-orange-50 border-r font-medium">Balance</TableHead>
                                            
                                            {/* Loan Interest Sub-headers */}
                                            <TableHead className="text-center bg-red-50 border-r font-medium">Dr.</TableHead>
                                            <TableHead className="text-center bg-red-50 border-r font-medium">Cr.</TableHead>
                                            <TableHead className="text-center bg-red-50 border-r font-medium">Balance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {passbookEntries.map((entry, index) => (
                                            <TableRow 
                                                key={entry.month_year} 
                                                className={
                                                    entry.is_accumulation_stop 
                                                        ? 'bg-red-50 border-red-200' 
                                                        : entry.is_opening_balance 
                                                            ? 'bg-yellow-50 font-bold' 
                                                            : index % 2 === 0 
                                                                ? 'bg-gray-50' 
                                                                : ''
                                                }
                                            >
                                                {/* Date/Month Column */}
                                                <TableCell className="text-center border-r font-medium">
                                                    {entry.is_opening_balance ? (
                                                        <div>
                                                            <div className="font-bold">OPENING</div>
                                                            <div className="text-xs">{entry.date_display}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center">
                                                            <div className="flex items-center">
                                                                {entry.month_name}
                                                                {entry.is_accumulation_stop && (
                                                                    <AlertTriangle className="w-4 h-4 ml-1 text-red-500" />
                                                                )}
                                                                {entry.allocation_details?.is_fulfilled && !entry.is_accumulation_stop && (
                                                                    <CheckCircle className="w-4 h-4 ml-1 text-green-500" />
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-600">{entry.date_display}</div>
                                                            {entry.is_accumulation_stop && (
                                                                <Badge variant="destructive" className="text-xs mt-1">
                                                                    OWING
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                
                                                {/* SHARES Columns */}
                                                <TableCell className="text-center bg-blue-50 border-r">
                                                    {formatCurrency(entry.shares_dr)}
                                                </TableCell>
                                                <TableCell className="text-center bg-blue-50 border-r">
                                                    {formatCurrency(entry.shares_cr)}
                                                </TableCell>
                                                <TableCell className="text-center bg-blue-50 border-r font-medium">
                                                    {formatCurrency(entry.shares_balance)}
                                                </TableCell>
                                                
                                                {/* SAVINGS Columns */}
                                                <TableCell className="text-center bg-green-50 border-r">
                                                    {formatCurrency(entry.savings_dr)}
                                                </TableCell>
                                                <TableCell className="text-center bg-green-50 border-r">
                                                    {formatCurrency(entry.savings_cr)}
                                                </TableCell>
                                                <TableCell className="text-center bg-green-50 border-r font-medium">
                                                    {formatCurrency(entry.savings_balance)}
                                                </TableCell>
                                                
                                                {/* SPECIAL SAVINGS Columns */}
                                                <TableCell className="text-center bg-purple-50 border-r">
                                                    {formatCurrency(entry.special_savings_dr)}
                                                </TableCell>
                                                <TableCell className="text-center bg-purple-50 border-r">
                                                    {formatCurrency(entry.special_savings_cr)}
                                                </TableCell>
                                                <TableCell className="text-center bg-purple-50 border-r font-medium">
                                                    {formatCurrency(entry.special_savings_balance)}
                                                </TableCell>
                                                
                                                {/* BUILDING FUND Columns */}
                                                <TableCell className="text-center bg-orange-50 border-r">
                                                    {formatCurrency(entry.building_dr)}
                                                </TableCell>
                                                <TableCell className="text-center bg-orange-50 border-r">
                                                    {formatCurrency(entry.building_cr)}
                                                </TableCell>
                                                <TableCell className="text-center bg-orange-50 border-r font-medium">
                                                    {formatCurrency(entry.building_balance)}
                                                </TableCell>
                                                
                                                {/* LOAN INTEREST Columns */}
                                                <TableCell className="text-center bg-red-50 border-r">
                                                    {formatCurrency(entry.loan_interest_dr)}
                                                </TableCell>
                                                <TableCell className="text-center bg-red-50 border-r">
                                                    {formatCurrency(entry.loan_interest_cr)}
                                                </TableCell>
                                                <TableCell className="text-center bg-red-50 border-r font-medium">
                                                    {formatCurrency(entry.loan_interest_balance)}
                                                </TableCell>
                                                
                                                {/* MONTHLY TOTAL Column */}
                                                <TableCell className="text-center bg-teal-50 border-r font-bold">
                                                    {formatCurrency(entry.monthly_total)}
                                                </TableCell>
                                                
                                                {/* FINAL BALANCE Column */}
                                                <TableCell className="text-center bg-indigo-50 font-bold">
                                                    {formatCurrency(entry.final_balance)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        
                                        {/* Final Balances Row */}
                                        {passbookEntries.length > 0 && (
                                            <TableRow className="bg-gray-200 font-bold">
                                                <TableCell className="text-center border-r">
                                                    {passbookEntries.some(entry => entry.is_accumulation_stop) 
                                                        ? 'ACCUMULATION STOPPED' 
                                                        : 'CLOSING BALANCE'
                                                    }
                                                </TableCell>
                                                
                                                {/* Shares Final Balance */}
                                                <TableCell colSpan={3} className="text-center bg-blue-100 border-r">
                                                    {formatCurrency(finalBalances.SHARES || 0)}
                                                </TableCell>
                                                
                                                {/* Savings Final Balance */}
                                                <TableCell colSpan={3} className="text-center bg-green-100 border-r">
                                                    {formatCurrency(finalBalances.SAVINGS || 0)}
                                                </TableCell>
                                                
                                                {/* Special Savings Final Balance */}
                                                <TableCell colSpan={3} className="text-center bg-purple-100 border-r">
                                                    {formatCurrency(finalBalances.SSAVINGS || 0)}
                                                </TableCell>
                                                
                                                {/* Building Fund Final Balance */}
                                                <TableCell colSpan={3} className="text-center bg-orange-100 border-r">
                                                    {formatCurrency(finalBalances.BUILDING || 0)}
                                                </TableCell>
                                                
                                                {/* Loan Interest Final Balance */}
                                                <TableCell colSpan={3} className="text-center bg-red-100 border-r">
                                                    {formatCurrency(finalBalances.LOAN_INTEREST || 0)}
                                                </TableCell>
                                                
                                                {/* Yearly Total */}
                                                <TableCell className="text-center bg-teal-100 border-r">
                                                    {formatCurrency(totalYearlyAmount)}
                                                </TableCell>
                                                
                                                {/* Grand Final Balance */}
                                                <TableCell className="text-center bg-indigo-100 font-bold text-lg">
                                                    {formatCurrency(passbookEntries[passbookEntries.length - 1]?.final_balance || 0)}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Accumulation Stopped Notice */}
                            {passbookEntries.some(entry => entry.is_accumulation_stop) && (
                                <div className="p-4 bg-red-50 border-t border-red-200">
                                    <div className="flex items-center justify-center">
                                        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                                        <p className="text-sm text-red-800 font-medium">
                                            <strong>Accumulation Stopped:</strong> Display ends at the first unpaid month. 
                                            Subsequent months will be shown once current obligations are fulfilled.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {passbookEntries.length === 0 && (
                        <Card>
                            <CardContent className="text-center py-12">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <div className="text-gray-500">No accumulation data available</div>
                                <Button variant="outline" asChild className="mt-4">
                                    <Link href={route('accumulation-passbook.index')}>Back to Members</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}