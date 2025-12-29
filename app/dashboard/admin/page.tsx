import { BarChart3, Settings, Users } from "lucide-react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function AdminDashboard() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Admin Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-2xl font-bold">管理者ダッシュボード</h1>
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/dashboard/admin/users"
            className="rounded-xl border bg-card p-6 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">ユーザー管理</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              ユーザーの追加・編集・削除
            </p>
          </Link>
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">統計</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">利用状況の分析</p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">設定</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">システム設定</p>
          </div>
        </div>
      </div>
    </>
  );
}
