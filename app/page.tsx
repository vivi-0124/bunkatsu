import { Header } from "@/components/layout/header";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto flex flex-col items-center justify-center gap-6 py-24 md:py-32 lg:py-40 px-4">
          <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Welcome to <span className="text-primary">HONO</span>
          </h1>
          <p className="max-w-[42rem] text-center text-lg text-muted-foreground sm:text-xl">
            シンプルで高速なWebアプリケーション
          </p>
        </section>
      </main>
      <footer className="border-t py-6 md:py-8">
        <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 HONO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
