"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export default function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;

    if (session) {
      const user = session.user as { role?: string };
      const role = user.role;
      if (role === "admin") {
        router.replace("/dashboard/admin");
      } else if (role === "tutor") {
        router.replace("/dashboard/tutor");
      } else if (role === "user") {
        router.replace("/dashboard/installments");
      } else {
        router.replace("/dashboard/student");
      }
    } else {
      router.replace("/");
    }
  }, [session, isPending, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}
