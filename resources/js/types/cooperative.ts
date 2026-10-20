

// types/cooperative.ts
// export interface Category {
//     id: number;
//     name: string;
//     month: number;
//     dailyMin: number;
//     initialDay: number;
//     OpenCard: number;
//     created_at: string;
//     monthly_amount?: number;
// }

// export interface PaymentStatus {
//     is_owing: boolean;
//     can_pay: boolean;
//     wallet_balance: number;
//     remaining_after_owing: number;
// }

// export interface CalculationDetails {
//     current_day: number;
//     registration_day: number;
//     is_registration_in_current_month: boolean;
//     current_month_start: string;
//     current_month_end: string;
//     expected_months?: number;
//     paid_months?: number;
//     current_month?: string;
//     registration_month?: string;
//     months_since_registration?: number;
// }

// export interface PaymentHistory {
//     month: string;
//     month_name: string;
//     expected_amount: number;
//     paid_amount: number;
//     is_paid: boolean;
//     payment_percentage: number;
// }

// export interface ConsistencyData {
//     status: 'very_consistent' | 'consistent' | 'moderately_consistent' | 'fairly_consistent' | 'inconsistent' | 'new_member' | 'not_registered' | 'no_category' | 'error';
//     payment_history: PaymentHistory[];
//     total_months: number;
//     paid_months: number;
//     completion_rate: number;
// }

// export interface CooperativeObligations {
//     status: 'no_category' | 'not_registered' | 'owing' | 'up_to_date' | 'error';
//     message: string;
//     amount_owed?: number;
//     months_owed: number;
//     total_owed: number;
//     amount_expected_to_have_paid: number;
//     amount_paid: number;
//     expected_months?: number;
//     registration_status: 'registered' | 'not_registered' | 'unknown';
//     consistency_status: 'very_consistent' | 'consistent' | 'moderately_consistent' | 'fairly_consistent' | 'inconsistent' | 'new_member' | 'not_registered' | 'no_category' | 'error';
//     monthly_amount?: number;
//     registration_date?: string;
//     category_details?: Category;
//     payment_status: PaymentStatus;
//     calculation_details: CalculationDetails;
// }

// export interface MemberBalances {
//     SHARES: number;
//     SAVINGS: number;
//     SSAVINGS: number;
//     WALLET: number;
//     BUILDING: number;
// }

// export interface CooperativeFinancialSummary {
//     member: {
//         id: number;
//         name: string;
//         mobile: string;
//         category: string;
//         nstatus: boolean;
//     };
//     obligations: CooperativeObligations;
//     balances: MemberBalances;
//     total_assets: number;
//     consistency: ConsistencyData;
// }

// export interface Member {
//     id: number;
//     name: string;
//     email: string;
//     mobile: string;
//     category: string;
//     nstatus: boolean;
//     created_at: string;
//     registration_track?: any;
//     category_details?: Category;
// }

// export interface PaginatedMembers {
//     data: Member[];
//     links: any[];
//     meta: any;
// }

// export interface CooperativeIndexProps {
//     members: PaginatedMembers;
//     cooperativeData?: CooperativeFinancialSummary[];
//     categories: Category[];
//     filters: {
//         search?: string;
//         category?: string;
//         status?: string;
//         registration?: string;
//     };
// }

// export interface CooperativeShowProps {
//     member: Member;
//     cooperativeSummary?: CooperativeFinancialSummary;
// }

// types/cooperative.ts
export interface Category {
    id: number;
    name: string;
    month: number;
    dailyMin: number;
    initialDay: number;
    OpenCard: number;
    created_at: string;
    monthly_amount?: number;
}

export interface PaymentStatus {
    is_owing: boolean;
    can_pay: boolean;
    wallet_balance: number;
    remaining_after_owing: number;
}

export interface CalculationDetails {
    current_day: number;
    registration_day: number;
    is_registration_in_current_month: boolean;
    current_month_start: string;
    current_month_end: string;
    expected_months?: number;
    paid_months?: number;
    current_month?: string;
    registration_month?: string;
    months_since_registration?: number;
}

export interface PaymentHistory {
    month: string;
    month_name: string;
    expected_amount: number;
    paid_amount: number;
    is_paid: boolean;
    payment_percentage: number;
}

export interface PaymentPatternData {
    status: 'excellent' | 'moderate' | 'fair' | 'poor' | 'very_poor' | 'new_member' | 'not_registered' | 'no_category' | 'error';
    payment_history: PaymentHistory[];
    total_months: number;
    paid_months: number;
    owed_months: number;
    completion_rate: number;
}

export interface ConsistencyData {
    status: 'very_consistent' | 'moderately_consistent' | 'fairly_consistent' | 'inconsistent' | 'new_member' | 'not_registered' | 'no_category' | 'error';
    current_streak: number;
    required_months: number;
    needed_for_very_consistent: number;
    progress_percentage: number;
    perfect_payments_count: number;
    category_name: string;
}

export interface CooperativeObligations {
    status: 'no_category' | 'not_registered' | 'owing' | 'up_to_date' | 'error';
    message: string;
    amount_owed?: number;
    months_owed: number;
    total_owed: number;
    amount_expected_to_have_paid: number;
    amount_paid: number;
    expected_months?: number;
    registration_status: 'registered' | 'not_registered' | 'unknown';
    payment_pattern_status: 'excellent' | 'moderate' | 'fair' | 'poor' | 'very_poor' | 'new_member' | 'not_registered' | 'no_category' | 'error';
    consistency_status: 'very_consistent' | 'moderately_consistent' | 'fairly_consistent' | 'inconsistent' | 'new_member' | 'not_registered' | 'no_category' | 'error';
    monthly_amount?: number;
    registration_date?: string;
    category_details?: Category;
    payment_status: PaymentStatus;
    calculation_details: CalculationDetails;
}

export interface MemberBalances {
    SHARES: number;
    SAVINGS: number;
    SSAVINGS: number;
    WALLET: number;
    BUILDING: number;
}

export interface CooperativeFinancialSummary {
    member: {
        id: number;
        name: string;
        mobile: string;
        category: string;
        nstatus: boolean;
    };
    obligations: CooperativeObligations;
    balances: MemberBalances;
    total_assets: number;
    payment_pattern: PaymentPatternData;
    consistency: ConsistencyData;
}

export interface Member {
    id: number;
    name: string;
    email: string;
    mobile: string;
    category: string;
    nstatus: boolean;
    created_at: string;
    registration_track?: any;
    category_details?: Category;
}

export interface PaginatedMembers {
    data: Member[];
    links: any[];
    meta: any;
}

export interface CooperativeIndexProps {
    members: PaginatedMembers;
    cooperativeData?: CooperativeFinancialSummary[];
    categories: Category[];
    filters: {
        search?: string;
        category?: string;
        status?: string;
        registration?: string;
    };
}

export interface CooperativeShowProps {
    member: Member;
    cooperativeSummary?: CooperativeFinancialSummary;
}