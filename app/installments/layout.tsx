import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";

export const metadata: Metadata = {
  title: "分割払い管理",
  description: "分割払いを管理するシンプルなアプリ",
};

export default function InstallmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-950 dark:via-indigo-950/30 dark:to-purple-950/30">
      <AppHeader />
      <div className="pb-8">{children}</div>
    </div>
  );
}
