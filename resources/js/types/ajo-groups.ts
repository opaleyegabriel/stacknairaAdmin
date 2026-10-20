// types/ajo-groups.ts
export interface AjoGroup {
    id: number;
    group_name: string;
    amount: number;
    frequency: string;
    status: string;
    current_round: number;
    max_members: number;
    start_date?: string;
    end_date?: string;
}

export interface GroupPerformance {
    total_expected: number;
    total_contributions: number;
    total_payouts: number;
    group_balance: number;
    completion_rate: number;
    members_without_payout: number;
    available_slots: number;
}

export interface GroupMember {
    id: number;
    mobile: string;
    joined_at: string;
    status: string;
    has_received: boolean;
    total_contributions: number;
    total_payouts: number;
    net_position: number;
    member?: {
        name: string;
        mobile: string;
        category: string;
    };
}

export interface GroupContribution {
    id: number;
    mobile: string;
    amount: number;
    created_at: string;
    member?: {
        name: string;
        mobile: string;
    };
}

export interface GroupPayout {
    id: number;
    receiver_mobile: string;
    amount: number;
    round_no: number;
    paid_at: string;
    receiver?: {
        name: string;
        mobile: string;
    };
}

export interface GroupData {
    group: AjoGroup;
    performance: GroupPerformance;
    members_count: number;
    creator_name?: string;
}

export interface PaginatedGroups {
    data: AjoGroup[];
    links: any[];
    meta: any;
}

export interface AjoGroupsIndexProps {
    groups: PaginatedGroups;
    performanceData: GroupData[];
    filters: {
        search?: string;
        status?: string;
        frequency?: string;
    };
}

// For member-focused views
// types/ajo-groups.ts
export interface MemberGroupSummary {
    total_groups_count: number;
    total_group_contributions: number;
    total_group_payouts: number;
    net_group_position: number;
    groups: any[];
    has_groups: boolean;
}

export interface MemberGroupData {
    member: {
        id: number;
        name: string;
        mobile: string;
        category: string;
        nstatus: boolean;
    };
    summary: MemberGroupSummary;
    groups: any[]; // Changed from active_groups
}