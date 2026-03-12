import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "分割払い管理 | Dashboard",
  description: "分割払いを管理するシンプルなアプリ",
};

export default function InstallmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen flex flex-col">{children}</div>;
}
