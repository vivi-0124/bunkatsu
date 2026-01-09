"use client";

import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="inline-block font-bold text-xl sm:text-2xl tracking-tighter">
            HONO
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">Login</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] p-0 border-none bg-transparent shadow-none">
                <DialogTitle className="sr-only">Login</DialogTitle>
                <DialogDescription className="sr-only">
                  Login to your account
                </DialogDescription>
                <LoginForm />
              </DialogContent>
            </Dialog>
          </div>
          <div className="border-l pl-4 h-6 flex items-center">
            <AnimatedThemeToggler className="p-2 hover:bg-accent rounded-full transition-colors" />
          </div>
        </div>
      </div>
    </header>
  );
}
