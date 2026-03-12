"use client";

import { CreditCard, Moon, Receipt, Sun, Users, Wallet } from "lucide-react";
import { useTheme } from "next-themes";
import type * as React from "react";
import { useEffect, useState } from "react";
import { NavSimple } from "@/components/dashboard/navigation/nav-simple";
import { NavUser } from "@/components/dashboard/navigation/nav-user";
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
    url: "/dashboard/fixed-costs",
    icon: CreditCard,
  },
  {
    title: "月別収支",
    url: "/dashboard/monthly",
    icon: Receipt,
  },
];

const navByRole: Record<string, typeof adminNav> = {
  admin: adminNav,
  user: userNav,
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // loading state or generic fallback
  const role = (user as { role?: string })?.role ?? "user";
  const navItems = navByRole[role] ?? userNav;

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="bg-linear-to-br from-indigo-500 to-purple-600 text-white flex aspect-square size-8 items-center justify-center rounded-lg shadow-lg shadow-indigo-500/20">
                  <Wallet className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">分かつ</span>
                  <span className="truncate text-xs capitalize text-muted-foreground">
                    {role}
                  </span>
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme} tooltip="テーマ切替">
              {mounted ? (
                resolvedTheme === "dark" ? (
                  <Sun />
                ) : (
                  <Moon />
                )
              ) : (
                <div className="size-4" />
              )}
              <span>テーマ</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
