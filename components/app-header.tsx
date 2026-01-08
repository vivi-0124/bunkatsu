"use client";

import { IconCreditCard, IconLogout, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

export function AppHeader() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.replace("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-linear-to-r from-indigo-600/95 via-purple-600/95 to-indigo-600/95 backdrop-blur-xl shadow-lg shadow-indigo-500/20">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <Link href="/installments" className="flex items-center gap-3 group">
            <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
              <IconCreditCard className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">
              分割払い管理
            </span>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <AnimatedThemeToggler className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors" />

          {/* User Menu */}
          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 hover:text-white"
                >
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                    <IconUser className="h-4 w-4" />
                  </div>
                  <span className="hidden sm:inline font-medium">
                    {session.user.name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <IconLogout className="h-4 w-4 mr-2" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
