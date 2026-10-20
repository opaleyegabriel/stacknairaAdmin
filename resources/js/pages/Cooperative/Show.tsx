// components/cooperative-show.tsx
import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Coins, PiggyBank, CreditCard, Wallet, AlertTriangle, CheckCircle, XCircle, Calendar, DollarSign, Loader2, Building, TrendingUp, Target, BarChart } from 'lucide-react';
import type { CooperativeShowProps, CooperativeFinancialSummary } from '@/types/cooperative';

// Safe default values
const DEFAULT_COOPERATIVE_SUMMARY: CooperativeFinancialSummary = {
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

export default function CooperativeShow({ member, cooperativeSummary }: CooperativeShowProps) {
    // Safe default values
    const safeCooperativeSummary: CooperativeFinancialSummary = cooperativeSummary || DEFAULT_COOPERATIVE_SUMMARY;
    const { obligations, balances, payment_pattern, consistency } = safeCooperativeSummary;

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
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

    const getStatusIcon = (status: string): JSX.Element => {
        const iconClass = "w-5 h-5";
        switch (status) {
            case 'not_registered':
                return <XCircle className={`${iconClass} text-red-500`} />;
            case 'owing':
                return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
            case 'up_to_date':
                return <CheckCircle className={`${iconClass} text-green-500`} />;
            case 'no_category':
                return <XCircle className={`${iconClass} text-gray-500`} />;
            case 'error':
                return <XCircle className={`${iconClass} text-red-500`} />;
            default:
                return <CheckCircle className={`${iconClass} text-green-500`} />;
        }
    };

    const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
        switch (status) {
            case 'not_registered':
                return 'destructive';
            case 'owing':
                return 'outline';
            case 'up_to_date':
                return 'default';
            case 'error':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const getStatusDisplayText = (status: string): string => {
        switch (status) {
            case 'not_registered':
                return 'Not Registered';
            case 'owing':
                return 'Owing';
            case 'up_to_date':
                return 'Up to Date';
            case 'no_category':
                return 'No Category';
            case 'error':
                return 'Error';
            default:
                return 'Unknown';
        }
    };

    const getPaymentPatternBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
        switch (status) {
            case 'excellent':
                return 'default';
            case 'moderate':
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

    const getPaymentPatternDisplayText = (status: string): string => {
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

    const getConsistencyBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
        switch (status) {
            case 'very_consistent':
                return 'default';
            case 'moderately_consistent':
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

    const getConsistencyDisplayText = (status: string): string => {
        switch (status) {
            case 'very_consistent': return 'Very Consistent';
            case 'moderately_consistent': return 'Moderately Consistent';
            case 'fairly_consistent': return 'Fairly Consistent';
            case 'inconsistent': return 'Inconsistent';
            case 'new_member': return 'New Member';
            case 'not_registered': return 'Not Registered';
            default: return 'Unknown';
        }
    };

    const getStatusMessage = (): string => {
        switch (obligations.status) {
            case 'not_registered':
                return 'No open card has been deducted and you have not registered';
            case 'no_category':
                return 'No category assigned to member';
            case 'owing':
                return `Registered on ${obligations.registration_date ? formatDate(obligations.registration_date) : 'unknown date'}`;
            case 'up_to_date':
                return 'Member is up-to-date with all cooperative payments';
            case 'error':
                return obligations.message || 'Error calculating obligations';
            default:
                return obligations.message || 'Status information not available';
        }
    };

    // Show loading state if data is not available
    if (!cooperativeSummary) {
        return (
            <AppLayout>
                <Head title={`Cooperative - ${member.name}`} />
                <div className="py-6">
                    <div className="px-4 mx-auto max-w-6xl sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('cooperative.index')}>
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Cooperative
                                    </Link>
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Cooperative Details</h1>
                                    <p className="text-sm text-gray-600">{member.name}</p>
                                </div>
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
            <Head title={`Cooperative - ${member.name}`} />
            <div className="py-6">
                <div className="px-4 mx-auto max-w-6xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <Button variant="outline" asChild>
                                <Link href={route('cooperative.index')}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Cooperative
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Cooperative Details</h1>
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

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Cooperative Obligations */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <DollarSign className="w-5 h-5 mr-2" />
                                    Cooperative Obligations
                                </CardTitle>
                                <CardDescription>
                                    Monthly contributions and outstanding amounts
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        {getStatusIcon(obligations.status)}
                                        <span className="ml-2 font-medium">Status</span>
                                    </div>
                                    <Badge variant={getStatusBadgeVariant(obligations.status)}>
                                        {getStatusDisplayText(obligations.status)}
                                    </Badge>
                                </div>

                                <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                                    {getStatusMessage()}
                                </div>

                                {obligations.category_details && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold">Category Details</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>Category:</div>
                                            <div className="font-medium">{obligations.category_details.name}</div>
                                            
                                            <div>Daily Minimum:</div>
                                            <div className="font-medium">{formatCurrency(obligations.category_details.dailyMin)}</div>
                                            
                                            <div>Monthly Amount:</div>
                                            <div className="font-medium">{formatCurrency(obligations.monthly_amount || 0)}</div>
                                            
                                            <div>Required Months:</div>
                                            <div className="font-medium">{obligations.category_details.month} months</div>
                                            
                                            <div>Open Card Fee:</div>
                                            <div className="font-medium">{formatCurrency(obligations.category_details.OpenCard)}</div>
                                        </div>
                                    </div>
                                )}

                                {(obligations.status === 'owing' || obligations.status === 'up_to_date') && (
                                    <div className="space-y-3 p-3 border rounded-lg">
                                        <h4 className="font-semibold text-blue-600">Payment Summary</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>Amount Expected:</div>
                                            <div className="font-medium">{formatCurrency(obligations.amount_expected_to_have_paid)}</div>
                                            
                                            <div>Amount Paid:</div>
                                            <div className="font-medium">{formatCurrency(obligations.amount_paid)}</div>
                                            
                                            <div>Months Owed:</div>
                                            <div className="font-medium">{obligations.months_owed}</div>
                                            
                                            <div className="font-semibold">Total Owed:</div>
                                            <div className={`font-semibold ${
                                                obligations.total_owed > 0 ? 'text-red-600' : 'text-green-600'
                                            }`}>
                                                {formatCurrency(obligations.total_owed)}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {obligations.status === 'owing' && (
                                    <>
                                        <div className="space-y-3 p-3 border rounded-lg bg-red-50">
                                            <h4 className="font-semibold text-red-600">Payment Analysis</h4>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>Wallet Balance:</div>
                                                <div className="font-medium">{formatCurrency(obligations.payment_status.wallet_balance)}</div>
                                                
                                                <div>Can Pay Full Amount:</div>
                                                <div className={`font-medium ${
                                                    obligations.payment_status.can_pay ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {obligations.payment_status.can_pay ? 'Yes' : 'No'}
                                                </div>
                                                
                                                {obligations.payment_status.can_pay && (
                                                    <>
                                                        <div>Remaining After Payment:</div>
                                                        <div className="font-medium text-green-600">
                                                            {formatCurrency(obligations.payment_status.remaining_after_owing)}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Financial Balances */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Wallet className="w-5 h-5 mr-2" />
                                    Financial Balances
                                </CardTitle>
                                <CardDescription>
                                    Current account balances and assets
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <Coins className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                                        <div className="text-sm text-gray-600">Shares</div>
                                        <div className="text-lg font-semibold text-blue-600">
                                            {formatCurrency(balances.SHARES)}
                                        </div>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <PiggyBank className="w-8 h-8 mx-auto mb-2 text-green-600" />
                                        <div className="text-sm text-gray-600">Savings</div>
                                        <div className="text-lg font-semibold text-green-600">
                                            {formatCurrency(balances.SAVINGS)}
                                        </div>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                                        <CreditCard className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                                        <div className="text-sm text-gray-600">Special Savings</div>
                                        <div className="text-lg font-semibold text-purple-600">
                                            {formatCurrency(balances.SSAVINGS)}
                                        </div>
                                    </div>
                                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                                        <Wallet className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                                        <div className="text-sm text-gray-600">Wallet</div>
                                        <div className="text-lg font-semibold text-orange-600">
                                            {formatCurrency(balances.WALLET)}
                                        </div>
                                    </div>
                                    <div className="text-center p-4 bg-teal-50 rounded-lg">
                                        <Building className="w-8 h-8 mx-auto mb-2 text-teal-600" />
                                        <div className="text-sm text-gray-600">Building Fund</div>
                                        <div className="text-lg font-semibold text-teal-600">
                                            {formatCurrency(balances.BUILDING)}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">Total Assets:</span>
                                        <span className="text-lg font-bold text-green-600">
                                            {formatCurrency(safeCooperativeSummary.total_assets)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Pattern */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <BarChart className="w-5 h-5 mr-2" />
                                    Payment Pattern
                                </CardTitle>
                                <CardDescription>
                                    Overall payment behavior and history
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <BarChart className="w-5 h-5 mr-2" />
                                        <span className="font-medium">Payment Pattern</span>
                                    </div>
                                    <Badge variant={getPaymentPatternBadgeVariant(obligations.payment_pattern_status)}>
                                        {getPaymentPatternDisplayText(obligations.payment_pattern_status)}
                                    </Badge>
                                </div>

                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {payment_pattern.total_months}
                                            </div>
                                            <div className="text-gray-600">Total Months</div>
                                        </div>
                                        <div className="text-center p-3 bg-green-50 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">
                                                {payment_pattern.paid_months}
                                            </div>
                                            <div className="text-gray-600">Months Paid</div>
                                        </div>
                                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {Math.round(payment_pattern.completion_rate)}%
                                            </div>
                                            <div className="text-gray-600">Completion Rate</div>
                                        </div>
                                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                                            <div className="text-2xl font-bold text-orange-600">
                                                {payment_pattern.owed_months}
                                            </div>
                                            <div className="text-gray-600">Months Owed</div>
                                        </div>
                                    </div>

                                    {payment_pattern.payment_history.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="font-semibold">Recent Payment History</h4>
                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                {payment_pattern.payment_history.slice(0, 8).map((month, index) => (
                                                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                                                        <span className="text-sm font-medium">{month.month_name}</span>
                                                        <div className="flex items-center space-x-3">
                                                            <span className={`text-sm ${
                                                                month.is_paid ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                                {formatCurrency(month.paid_amount)} / {formatCurrency(month.expected_amount)}
                                                            </span>
                                                            <div className="w-20 bg-gray-200 rounded-full h-2">
                                                                <div 
                                                                    className={`h-2 rounded-full ${
                                                                        month.payment_percentage >= 80 ? 'bg-green-500' : 
                                                                        month.payment_percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                                    }`}
                                                                    style={{ width: `${Math.min(month.payment_percentage, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                            <Badge variant={month.is_paid ? 'default' : 'destructive'} className="text-xs">
                                                                {month.is_paid ? 'Paid' : 'Unpaid'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {payment_pattern.payment_history.length === 0 && obligations.registration_status === 'registered' && (
                                        <div className="text-center py-4 text-gray-500">
                                            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p>No payment history available for analysis</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Perfect Payment Consistency */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Target className="w-5 h-5 mr-2" />
                                    Perfect Payment Consistency
                                </CardTitle>
                                <CardDescription>
                                    Based on {consistency.required_months}-month requirement for {consistency.category_name}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <Target className="w-5 h-5 mr-2" />
                                        <span className="font-medium">Consistency Status</span>
                                    </div>
                                    <Badge variant={getConsistencyBadgeVariant(obligations.consistency_status)}>
                                        {getConsistencyDisplayText(obligations.consistency_status)}
                                    </Badge>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Progress to Very Consistent</span>
                                        <span>{Math.round(consistency.progress_percentage)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div 
                                            className={`h-3 rounded-full ${
                                                consistency.progress_percentage >= 100 ? 'bg-green-500' :
                                                consistency.progress_percentage >= 66 ? 'bg-blue-500' :
                                                consistency.progress_percentage >= 33 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${consistency.progress_percentage}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {consistency.current_streak}
                                        </div>
                                        <div className="text-gray-600">Current Streak</div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">
                                            {consistency.required_months}
                                        </div>
                                        <div className="text-gray-600">Required Months</div>
                                    </div>
                                </div>

                                {consistency.current_streak > 0 && (
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <h4 className="font-semibold text-green-600">Current Perfect Streak</h4>
                                        <div className="text-sm text-green-600">
                                            {consistency.current_streak} consecutive perfect payment(s)
                                        </div>
                                        {consistency.needed_for_very_consistent > 0 && (
                                            <div className="text-sm text-orange-600 mt-1">
                                                Need {consistency.needed_for_very_consistent} more perfect month(s) to achieve "Very Consistent"
                                            </div>
                                        )}
                                    </div>
                                )}

                                {consistency.perfect_payments_count === 0 && consistency.required_months > 0 && (
                                    <div className="p-3 bg-yellow-50 rounded-lg">
                                        <h4 className="font-semibold text-yellow-600">No Perfect Payments Yet</h4>
                                        <div className="text-sm text-yellow-600">
                                            Member needs to make {consistency.required_months} consecutive perfect payments to achieve "Very Consistent" status
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}