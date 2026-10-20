// resources/js/Pages/Passbook/Show.tsx

import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    FileText,
    Calendar,
    Clock
} from 'lucide-react';
import type { PassbookShowProps } from '@/types/passbook';
import { route } from 'ziggy-js';

export default function PassbookShow({ 
    member, 
    passbookEntries, 
    finalBalances, 
    availableYears, 
    filters 
}: PassbookShowProps) {
    const formatCurrency = (amount: number): string => {
        if (amount === 0) return '-';
        return new Intl.NumberFormat('en-NG', {
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const handleYearChange = (year: number) => {
        router.get(route('passbook.show', member.id), {
            year
        }, {
            preserveState: true,
            replace: true,
        });
    };

    // Add this function to your PassbookShow.tsx component

    const handleExport = () => {
        // Create a hidden link to trigger the download
        const link = document.createElement('a');
        link.href = route('passbook.export', {
            id: member.id,
            year: filters.year
        });
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculate total monthly amount for the year (excluding opening balance)
    const totalYearlyAmount = passbookEntries
        .filter(entry => !entry.is_opening_balance)
        .reduce((sum, entry) => sum + entry.monthly_total, 0);

    return (
        <AppLayout>
            <Head title={`Passbook - ${member.name}`} />
            <div className="py-6">
                <div className="px-4 mx-auto max-w-8xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <Button variant="outline" asChild>
                                <Link href={route('passbook.index')}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Passbooks
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Member Passbook</h1>
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
                            <Button variant="outline" size="sm" onClick={handleExport}>
                                <Download className="w-4 h-4 mr-1" />
                                Export PDF
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={route('passbook.schedule', member.id)}>
                                    <Clock className="w-4 h-4 mr-1" />
                                    View Schedule
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Year Filter */}
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-4">
                                <div className="space-y-2 flex-1">
                                    <label className="text-sm font-medium">Select Year</label>
                                    <Select 
                                        value={filters.year.toString()} 
                                        onValueChange={(value) => handleYearChange(parseInt(value))}
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
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>Showing transactions for {filters.year}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Passbook Table - With Monthly Total and Final Balance */}
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
                                                className={entry.is_opening_balance ? 'bg-yellow-50 font-bold' : index % 2 === 0 ? 'bg-gray-50' : ''}
                                            >
                                                {/* Date/Month Column */}
                                                <TableCell className="text-center border-r font-medium">
                                                    {entry.is_opening_balance ? (
                                                        <div>
                                                            <div className="font-bold">OPENING</div>
                                                            <div className="text-xs">{entry.date_display}</div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div>{entry.month_name}</div>
                                                            <div className="text-xs text-gray-600">{entry.date_display}</div>
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
                                                    CLOSING BALANCE {filters.year}
                                                </TableCell>
                                                
                                                {/* Shares Final Balance */}
                                                <TableCell colSpan={3} className="text-center bg-blue-100 border-r">
                                                    {formatCurrency(finalBalances.SHARES)}
                                                </TableCell>
                                                
                                                {/* Savings Final Balance */}
                                                <TableCell colSpan={3} className="text-center bg-green-100 border-r">
                                                    {formatCurrency(finalBalances.SAVINGS)}
                                                </TableCell>
                                                
                                                {/* Special Savings Final Balance */}
                                                <TableCell colSpan={3} className="text-center bg-purple-100 border-r">
                                                    {formatCurrency(finalBalances.SSAVINGS)}
                                                </TableCell>
                                                
                                                {/* Building Fund Final Balance */}
                                                <TableCell colSpan={3} className="text-center bg-orange-100 border-r">
                                                    {formatCurrency(finalBalances.BUILDING)}
                                                </TableCell>
                                                
                                                {/* Loan Interest Final Balance */}
                                                <TableCell colSpan={3} className="text-center bg-red-100 border-r">
                                                    {formatCurrency(finalBalances.LOAN_INTEREST)}
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
                        </CardContent>
                    </Card>

                    {passbookEntries.length === 0 && (
                        <Card>
                            <CardContent className="text-center py-12">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <div className="text-gray-500">No transactions found for {filters.year}</div>
                                <Button variant="outline" asChild className="mt-4">
                                    <Link href={route('passbook.index')}>Back to Members</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}