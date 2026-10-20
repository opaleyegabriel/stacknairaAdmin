import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    Users,
    UserPenIcon,
    UserCheck,
    Handshake,
    HandCoins,
    BookOpen,
    BookOpenCheck,
} from 'lucide-react';
import AppLogo from './app-logo';
import { route } from 'ziggy-js'

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
        icon: LayoutGrid,
    },
    {
        title: 'Users',
        href: route('users.index'),
        icon: Users,
        permission: 'view_users',
    },
    {
        title: 'Roles',
        href: route('roles.index'),
        icon: UserPenIcon,
        permission: 'view_roles', // Added consistent permission
    },
    {
        title: 'Members',
        href: route('members.index'),
        icon: Users,
        permission: 'view_members', // Added consistent permission
    },
    {
        title: 'Cooperative',
        href: route('cooperative.index'),
        icon: UserCheck,
        permission: 'view_cooperative', // Added consistent permission
    },
    {
        title: 'Single Contribution',
        href: route('contribution-plans.index'),
        icon: HandCoins,
        permission: 'view_ajo_single', // Added consistent permission
    },
    {
        title: 'Group Contribution',
        href: route('ajo-groups.index'),
        icon: Handshake,
        permission: 'view_ajo_group', // Added consistent permission
    },
    {
        title: 'My Referrals',
        href: route('referrals.index'),
        icon: Handshake,
        permission: 'view_referrals', // Added consistent permission
    },
    {
        title: 'Schedule',
        href: route('passbook.index'),
        icon: BookOpen,
        permission: 'view_cooperative', // Added consistent permission
    },
    {
        title: 'Accumulation Passbook',
        href: route('accumulation-passbook.index'),
        icon: BookOpenCheck,
        permission: 'view_cooperative', // Added consistent permission
    },
    

    // Uncomment and adjust these as needed:
    // {
    //     title: 'Patient Management',
    //     icon: PanelTopInactive,
    //     permission: 'view_patients',
    //     children: [
    //         {
    //             title: 'Patients',
    //             href: route('patients.index'),
    //             icon: Users,
    //         },
    //         {
    //             title: 'Patient Profiles',
    //             href: route('patient-profiles.index'),
    //             icon: IdCardIcon,
    //         },
    //         {
    //             title: 'Patient Allergies',
    //             href: route('patient-allergies.index'),
    //             icon: FlaskConical,
    //             permission: 'view_patient_allergies',
    //         },
    //     ],
    // },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { props } = usePage();
    const userPermissions: string[] = props.auth?.permissions ?? [];
    const unresolvedAlertCount = props.unresolvedAlertCount ?? 0;

    const filteredNavItems = mainNavItems
        .map(item => {
            // If the item has children, filter them by permissions
            if (item.children) {
                const updatedChildren = item.children.map(child => {
                    // Add badge only for Inventory Alerts
                    if (child.title === "Inventory Alerts") {
                        return {
                            ...child,
                            badge:
                                unresolvedAlertCount > 0 && (
                                    <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs px-2 py-1 animate-pulse">
                                        {unresolvedAlertCount}
                                    </span>
                                ),
                        };
                    }
                    return child;
                });

                // Keep only children the user has permission for
                const visibleChildren = updatedChildren.filter(
                    child => !child.permission || userPermissions.includes(child.permission)
                );

                // If no children are visible, remove the whole parent
                if (visibleChildren.length === 0) return null;

                return { ...item, children: visibleChildren };
            }

            // For parent items without children, check permission
            if (!item.permission || userPermissions.includes(item.permission)) {
                return item;
            }

            return null;
        })
        .filter(Boolean) as NavItem[];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={route('dashboard')} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}