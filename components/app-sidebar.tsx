"use client";

import { CreditCard, GraduationCap, Users } from "lucide-react";
import type * as React from "react";
import { NavSimple } from "@/components/nav-simple";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

// Role-specific navigation
const adminNav = [
  {
    title: "ユーザー管理",
    url: "/dashboard/admin/users",
    icon: Users,
  },
];

const userNav = [
  {
    title: "分割払い",
    url: "/dashboard/installments",
    icon: CreditCard,
  },
];

const navByRole: Record<string, typeof adminNav> = {
  admin: adminNav,
  user: userNav,
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  // loading state or generic fallback
  const role = (user as { role?: string })?.role ?? "user";
  const navItems = navByRole[role] ?? userNav;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GraduationCap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Dashboard</span>
                  <span className="truncate text-xs capitalize">{role}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavSimple items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
