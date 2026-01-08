import type { Metadata } from "next";

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
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {children}
    </div>
  );
}
