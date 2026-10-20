// types/passbook.ts

// types/passbook.ts

export interface PassbookEntry {
    month_year: string;
    month_name: string;
    date_display: string;
    shares_dr: number;
    shares_cr: number;
    shares_balance: number;
    savings_dr: number;
    savings_cr: number;
    savings_balance: number;
    special_savings_dr: number;
    special_savings_cr: number;
    special_savings_balance: number;
    building_dr: number;
    building_cr: number;
    building_balance: number;
    loan_interest_dr: number;
    loan_interest_cr: number;
    loan_interest_balance: number;
    monthly_total: number; // Total for the month
    final_balance: number; // Final balance after this month
    is_opening_balance?: boolean;
}

export interface FinalBalances {
    SHARES: number;
    SAVINGS: number;
    SSAVINGS: number;
    BUILDING: number;
    LOAN_INTEREST: number;
}


export interface PassbookTotals {
    shares_dr: number;
    shares_cr: number;
    savings_dr: number;
    savings_cr: number;
    special_savings_dr: number;
    special_savings_cr: number;
    building_dr: number;
    building_cr: number;
    loan_interest_dr: number;
    loan_interest_cr: number;
}

export interface PassbookShowProps {
    member: any;
    passbookEntries: PassbookEntry[];
    finalBalances: FinalBalances;
    availableYears: number[];
    filters: {
        year: number;
    };
}


export interface PassbookIndexProps {
    members: any;
    filters: {
        search?: string;
        status?: string;
    };
}

// Add these new interfaces
export interface TransactionDetail {
    type: string;
    debit: number;
    credit: number;
    description: string;
    time: string;
}

export interface ScheduleEntry {
    date: string;
    date_display: string;
    description: string;
    shares_dr: number;
    shares_cr: number;
    shares_balance: number;
    savings_dr: number;
    savings_cr: number;
    savings_balance: number;
    special_savings_dr: number;
    special_savings_cr: number;
    special_savings_balance: number;
    building_dr: number;
    building_cr: number;
    building_balance: number;
    loan_interest_dr: number;
    loan_interest_cr: number;
    loan_interest_balance: number;
    daily_total: number;
    final_balance: number;
    is_opening_balance?: boolean;
    transaction_type?: string;
    transaction_details: TransactionDetail[];
}

export interface MonthlyTotals {
    shares_dr: number;
    shares_cr: number;
    savings_dr: number;
    savings_cr: number;
    special_savings_dr: number;
    special_savings_cr: number;
    building_dr: number;
    building_cr: number;
    loan_interest_dr: number;
    loan_interest_cr: number;
    total_dr: number;
    total_cr: number;
    net_total: number;
}

// export interface PassbookScheduleProps {
//     member: any;
//     scheduleEntries: ScheduleEntry[];
//     monthlyTotals: MonthlyTotals;
//     availableYears: number[];
//     availableMonths: { value: number; name: string }[];
//     filters: {
//         year: number;
//         month: number;
//     };
// }
// types/passbook.ts

// Simple schedule types
export interface SimpleTransaction {
    date: string;
    time: string;
    account_type: string;
    description: string;
    transaction_type: 'Payment' | 'Deductions';
    amount: number;
    type: string;
    debit: number;
    credit: number;
}

export interface MonthlySummary {
    total_payments: number;
    total_withdrawals: number;
    net_total: number;
    transaction_count: number;
    by_account: {
        [key: string]: {
            payments: number;
            withdrawals: number;
        };
    };
}

export interface PassbookScheduleProps {
    member: any;
    transactions: SimpleTransaction[];
    monthlySummary: MonthlySummary;
    availableYears: number[];
    availableMonths: { value: number; name: string }[];
    filters: {
        year: number;
        month: number;
    };
}