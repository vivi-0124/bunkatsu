"use client";

import {
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  History,
  MapPin,
  UserCheck,
  Users,
} from "lucide-react";
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
  {
    title: "エリア管理",
    url: "/dashboard/admin/areas",
    icon: MapPin,
  },
  {
    title: "コース管理",
    url: "/dashboard/admin/courses",
    icon: BookOpen,
  },
  {
    title: "学期管理",
    url: "/dashboard/admin/terms",
    icon: Calendar,
  },
  {
    title: "受講登録管理",
    url: "/dashboard/admin/student-term-selections",
    icon: UserCheck,
  },
  {
    title: "レッスン枠管理",
    url: "/dashboard/admin/lesson-slots",
    icon: Clock,
  },
];

const studentNav = [
  {
    title: "コース",
    url: "/dashboard/student/courses",
    icon: BookOpen,
  },
  {
    title: "学習履歴",
    url: "/dashboard/student/history",
    icon: History,
  },
];

const tutorNav = [
  {
    title: "レッスン管理",
    url: "/dashboard/tutor/lessons",
    icon: Calendar,
  },
  {
    title: "生徒一覧",
    url: "/dashboard/tutor/students",
    icon: Users,
  },
];

const navByRole: Record<string, typeof adminNav> = {
  admin: adminNav,
  student: studentNav,
  tutor: tutorNav,
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  // loading state or generic fallback
  const role = (user as { role?: string })?.role ?? "student";
  const navItems = navByRole[role] ?? studentNav;

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
