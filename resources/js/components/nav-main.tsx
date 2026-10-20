import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { type NavItem } from '@/types'
import { Link, usePage } from '@inertiajs/react'
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

export function NavMain({ items = [] }: { items: NavItem[] }) {
  const page = usePage()
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  function toggleGroup(title: string) {
    setOpenGroup(prev => (prev === title ? null : title))
  }

  return (
    <SidebarGroup className="px-2 py-0">
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map(item =>
          item.children ? (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                onClick={() => toggleGroup(item.title)}
                tooltip={{ children: item.title }}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {item.icon && <item.icon size={16} />}
                    <span>{item.title}</span>
                  </div>
                  {openGroup === item.title ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </div>
              </SidebarMenuButton>

              {openGroup === item.title && (
                <SidebarMenu className="ml-2">
                  {item.children.map(child => (
                    <SidebarMenuItem key={child.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={page.url.startsWith(child.href)}
                        tooltip={{ children: child.title }}
                      >
                        <Link href={child.href} prefetch>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              {child.icon && <child.icon size={16} />}
                              <span>{child.title}</span>
                            </div>
                            {child.badge && child.badge}
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )}
            </SidebarMenuItem>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={page.url.startsWith(item.href)}
                tooltip={{ children: item.title }}
              >
                <Link href={item.href} prefetch>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {item.icon && <item.icon size={16} />}
                      <span>{item.title}</span>
                    </div>
                    {item.badge && item.badge}
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
