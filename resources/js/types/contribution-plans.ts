// types/contribution-plans.ts
export interface ContributionPlan {
    id: number;
    amount: number;
    frequency: string;
    status: string;
    start_date?: string;
    end_date?: string;
    total_contributions: number;
    remaining_amount: number;
    completion_percentage: number;
}

export interface ContributionPlanSummary {
    active_plans_count: number;
    completed_plans_count: number;
    total_active_amount: number;
    total_completed_amount: number;
    total_contributions: number;
    active_plans: ContributionPlan[];
    has_active_plans: boolean;
}

export interface ContributionPlanMember {
    id: number;
    name: string;
    mobile: string;
    category: string;
    nstatus: boolean;
}

// In your types file
// types/contribution-plans.ts
export interface AjoContributionSummary {
    total_paid: number;
    total_withdrawn: number;
    net_balance: number;
}

export interface ContributionPlanData {
    member: ContributionPlanMember;
    summary: ContributionPlanSummary;
    contribution_plans: ContributionPlan[];
    ajo_contributions: AjoContributionSummary;
}



export interface PaginatedMembers {
    data: Member[];
    links: any[];
    meta: any;
}

export interface ContributionPlansIndexProps {
    members: PaginatedMembers;
    contributionData: ContributionPlanData[];
    categories: Category[];
    filters: {
        search?: string;
        plan_status?: string;
        category?: string;
    };
}