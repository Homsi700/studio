"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { navItems } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Aperture } from 'lucide-react'; // Placeholder for logo
import { ThemeToggle } from './ThemeToggle';

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" side="right"> {/* side="right" for RTL layout makes more sense for menu on right */}
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Aperture className="w-8 h-8 text-primary" />
          <h1 className="font-headline text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">
            دوامي
          </h1>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  className={cn(
                    'w-full justify-start',
                    pathname === item.href && 'bg-sidebar-accent text-sidebar-accent-foreground'
                  )}
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label, className: "font-body" }}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="group-data-[collapsible=icon]:hidden font-body">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 flex items-center justify-center group-data-[collapsible=icon]:justify-center">
         {/* Intentionally empty or add settings/logout later if needed */}
      </SidebarFooter>
    </Sidebar>
  );
}
