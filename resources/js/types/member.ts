export interface Member {
    id: number;
    name: string;
    email: string;
    mobile: string;
    pwd: string;
    rmobile: string;
    category: string;
    bank_name: string;
    account_name: string;
    account_number: string;
    nstatus: boolean;
    cooperator: boolean;
    photo?: string;
    photo_url?: string;
    created_at: string;
    referrals_made_count?: number;
    ajo_memberships_count?: number;
    is_fully_registered?: boolean // New field

}

// Add statement types
export interface StatementRequest {
    start_date?: string;
    end_date?: string;
    type?: string;
}

export interface StatementData {
    member: Member;
    transactions: Balance[];
    opening_balance: number;
    closing_balance: number;
    period: {
        start?: string;
        end?: string;
    };
    summary: any;
}

export interface MemberSetup {
    id: number;
    mobile: string;
    type: string;
    pcent: number;
    created_at: string;
}

export interface Balance {
    id: number;
    reference: string;
    description: string;
    mobile: string;
    account_number: string;
    type: string;
    debit: number;
    credit: number;
    created_at: string;
}

export interface Referral {
    id: number;
    member: string;
    referedBy: string;
    amount: number;
    created_at: string;
    referred_member?: Member;
}

export interface AjoMembership {
    id: number;
    group_id: number;
    mobile: string;
    name: string;
    joined_at: string;
    left_at: string | null;
    rejoined_at: string;
    is_system: boolean;
    has_received: boolean;
    received_round: number;
    received_date: string;
    group?: AjoGroup;
}

export interface AjoGroup {
    id: number;
    group_name: string;
    amount: number;
    members: number;
    interval_type: string;
    start_date: string;
    current_round: number;
    status: string;
}

export interface BalanceSummary {
    SHARES: number;
    SAVINGS: number;
    SSAVINGS: number;
    WALLET: number;
    BUILDING: number;
}
