import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Printer, FileText, Coins, PiggyBank, CreditCard, Wallet, Home, Users, User, Building2 } from 'lucide-react';
import type { StatementData } from '@/types/member';

interface StatementPreviewProps {
    member: any;
    statementData: StatementData;
    filters: {
        start_date?: string;
        end_date?: string;
        type?: string;
    };
}

export default function StatementPreview({ member, statementData, filters }: StatementPreviewProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getAccountIcon = (type: string) => {
        switch (type) {
            case 'SHARES': return <Coins className="w-4 h-4" />;
            case 'SAVINGS': return <PiggyBank className="w-4 h-4" />;
            case 'SSAVINGS': return <CreditCard className="w-4 h-4" />;
            case 'WALLET': return <Wallet className="w-4 h-4" />;
            case 'BUILDING': return <Home className="w-4 h-4" />;
            case 'AJO': return <Users className="w-4 h-4" />;
            case 'AJO_GROUP': return <Building2 className="w-4 h-4" />;
            case 'AJO_NORMAL': return <User className="w-4 h-4" />;
            default: return <Wallet className="w-4 h-4" />;
        }
    };

    const getAccountName = (type: string) => {
        switch (type) {
            case 'SHARES': return 'Shares';
            case 'SAVINGS': return 'Savings';
            case 'SSAVINGS': return 'Special Savings';
            case 'WALLET': return 'Wallet';
            case 'BUILDING': return 'Building Fund';
            // case 'AJO': return 'Total Ajo';
            case 'AJO_GROUP': return 'Ajo Groups';
            case 'AJO_NORMAL': return 'Ajo Personal';
            default: return type;
        }
    };

    const handleDownload = () => {
        const params = new URLSearchParams({
            ...filters,
            download: '1',
        });
        window.open(route('members.generate-statement', [member.id]) + '?' + params.toString(), '_blank');
    };

    const handlePrint = () => {
        const params = new URLSearchParams(filters);
        window.open(route('members.generate-statement', [member.id]) + '?' + params.toString(), '_blank');
    };

    // Filter out zero balances for cleaner display (optional)
    const nonZeroBalances = Object.entries(statementData.summary || {}).filter(([_, amount]) => amount !== 0);

    return (
        <AppLayout>
            <Head title={`Statement - ${member.name}`} />
            <div className="py-6">
                <div className="px-4 mx-auto max-w-6xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <Button variant="outline" asChild>
                                <Link href={route('members.show', member.id)}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Member
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Account Statement</h1>
                                <p className="text-sm text-gray-600">
                                    {member.name} - {member.account_number}
                                </p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Button variant="outline" onClick={handleDownload}>
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                            </Button>
                            <Button variant="outline" onClick={handlePrint}>
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                        </div>
                    </div>

                    {/* Account Balances Summary */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Account Balances Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Main Accounts */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                                {['SHARES', 'SAVINGS', 'SSAVINGS', 'WALLET', 'BUILDING'].map(type => (
                                    statementData.summary?.[type] !== undefined && (
                                        <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-center mb-2">
                                                {getAccountIcon(type)}
                                            </div>
                                            <div className="text-sm text-gray-600 font-medium">
                                                {getAccountName(type)}
                                            </div>
                                            <div className={`text-lg font-semibold ${
                                                statementData.summary[type] >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {formatCurrency(statementData.summary[type])}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>

                            {/* Ajo Breakdown (if available) */}
                            {(statementData.summary?.AJO_GROUP !== undefined || statementData.summary?.AJO_NORMAL !== undefined) && (
                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Ajo Breakdown</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {statementData.summary?.AJO_CONTRIBUTIONS !== undefined && (
                                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                <div className="flex items-center justify-center mb-1">
                                                    <Users className="w-4 h-4" />
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Total Contributions
                                                </div>
                                                <div className="text-md font-semibold text-blue-600">
                                                    {formatCurrency(statementData.summary.AJO_CONTRIBUTIONS)}
                                                </div>
                                            </div>
                                        )}
                                        {statementData.summary?.AJO_PAYOUTS !== undefined && (
                                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                                <div className="flex items-center justify-center mb-1">
                                                    <Download className="w-4 h-4" />
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Total Payouts
                                                </div>
                                                <div className="text-md font-semibold text-green-600">
                                                    {formatCurrency(statementData.summary.AJO_PAYOUTS)}
                                                </div>
                                            </div>
                                        )}
                                        {statementData.summary?.AJO_GROUP !== undefined && (
                                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                                <div className="flex items-center justify-center mb-1">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Net Group Balance
                                                </div>
                                                <div className={`text-md font-semibold ${
                                                    statementData.summary.AJO_GROUP >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {formatCurrency(statementData.summary.AJO_GROUP)}
                                                </div>
                                            </div>
                                        )}
                                        {statementData.summary?.AJO_NORMAL !== undefined && (
                                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                                                <div className="flex items-center justify-center mb-1">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Personal Ajo
                                                </div>
                                                <div className={`text-md font-semibold ${
                                                    statementData.summary.AJO_NORMAL >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {formatCurrency(statementData.summary.AJO_NORMAL)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    

                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Statement Summary */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Statement Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-sm text-gray-600">Opening Balance</div>
                                    <div className="text-lg font-semibold">
                                        {formatCurrency(statementData.opening_balance)}
                                    </div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-sm text-gray-600">Closing Balance</div>
                                    <div className="text-lg font-semibold">
                                        {formatCurrency(statementData.closing_balance)}
                                    </div>
                                </div>
                                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                    <div className="text-sm text-gray-600">Net Change</div>
                                    <div className={`text-lg font-semibold ${
                                        (statementData.closing_balance - statementData.opening_balance) >= 0 
                                            ? 'text-green-600' 
                                            : 'text-red-600'
                                    }`}>
                                        {formatCurrency(statementData.closing_balance - statementData.opening_balance)}
                                    </div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <div className="text-sm text-gray-600">Transactions</div>
                                    <div className="text-lg font-semibold">
                                        {statementData.transactions.length}
                                    </div>
                                </div>
                            </div>

                            {/* Period Info */}
                            <div className="flex justify-between items-center text-sm text-gray-600">
                                <div>
                                    <strong>Period:</strong>{' '}
                                    {statementData.period.start ? formatDate(statementData.period.start) : 'Beginning'} 
                                    {' to '}
                                    {statementData.period.end ? formatDate(statementData.period.end) : 'Current'}
                                </div>
                                <div>
                                    <strong>Generated:</strong> {new Date().toLocaleDateString()}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Transactions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {statementData.transactions.map((transaction, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex-1">
                                            <div className="font-medium">{transaction.description}</div>
                                            <div className="text-sm text-gray-500">
                                                <Badge variant="outline" className="mr-2">
                                                    {transaction.type}
                                                </Badge>
                                                {formatDate(transaction.created_at)}
                                                {transaction.reference && (
                                                    <span className="ml-2">• Ref: {transaction.reference}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {transaction.debit > 0 && (
                                                <div className="font-medium text-green-600">
                                                    +{formatCurrency(transaction.debit)}
                                                </div>
                                            )}
                                            {transaction.credit > 0 && (
                                                <div className="font-medium text-red-600">
                                                    -{formatCurrency(transaction.credit)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {statementData.transactions.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <div>No transactions found for the selected period</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}