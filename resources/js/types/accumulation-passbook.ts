// types/accumulation-passbook.ts

export interface AccumulationTransaction {
    type: string;
    amount: number;
    date: string;
    description: string;
}

export interface AccumulationEntry {
    month_year: string;
    month_name: string;
    date_display: string;
    monthly_target: number;
    paid_this_month: number;
    accumulated_total: number;
    required_for_month: number;
    current_balance: number;
    carry_over: number;
    is_fulfilled: boolean;
    fulfilled_months: number;
    transaction_count: number;
    transactions: AccumulationTransaction[];
}
export interface AccumulationPassbookEntry {
    month_year: string;
    month_name: string;
    date_display: string;
    monthly_target: number;
    allocated_amount: number;
    is_fulfilled: boolean;
    shortfall: number;
    remaining_payments: number;
    total_allocated: number;
    months_fulfilled: number;
    current_balance: number;
    payment_status: 'Fulfilled' | 'Partial' | 'Unpaid';
}

export interface AccumulationSummary {
    total_payments: number;
    total_allocated: number;
    months_fulfilled: number;
    months_owing: number;
    remaining_balance: number;
}


export interface AccumulationPassbookShowProps {
    member: any;
    passbookEntries: AccumulationPassbookEntry[];
    summary: AccumulationSummary;
    category: any;
    monthlyTarget: number;
    availableYears: number[];
    filters: {
        year: number;
    };
}

export interface AccumulationPassbookIndexProps {
    members: any;
    categories: any[];
    filters: {
        search?: string;
        category?: string;
        status?: string;
    };
}
// types/accumulation-passbook.ts




