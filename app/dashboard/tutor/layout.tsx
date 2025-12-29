"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const user = session?.user as { role?: string } | undefined;

  useEffect(() => {
    if (!isPending && user?.role !== "tutor") {
      router.replace("/dashboard");
    }
  }, [user, isPending, router]);

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (user?.role !== "tutor") {
    return null;
  }

  return <>{children}</>;
}
