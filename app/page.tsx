"use client";

import {
  IconArrowRight,
  IconCalendar,
  IconChartBar,
  IconCheck,
  IconDeviceMobile,
  IconLock,
  IconSparkles,
} from "@tabler/icons-react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Home() {
  const features = [
    {
      icon: IconCalendar,
      title: "スケジュール管理",
      description:
        "月ごとの支払いスケジュールを自動計算。いつ何を払うか一目で確認できます。",
    },
    {
      icon: IconChartBar,
      title: "支払い状況の可視化",
      description:
        "グラフやチャートで支払い状況を視覚的に把握。進捗を一目で確認できます。",
    },
    {
      icon: IconDeviceMobile,
      title: "どこからでもアクセス",
      description:
        "スマホ・タブレット・PCに対応。いつでもどこでも支払い管理ができます。",
    },
    {
      icon: IconLock,
      title: "安全なデータ管理",
      description:
        "暗号化されたセキュアな環境でデータを保護。あなたの情報は安全です。",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <IconSparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="inline-block font-bold text-xl sm:text-2xl tracking-tighter">
              bunkatsu
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">ログイン</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] p-0 border-none bg-transparent shadow-none">
                <DialogTitle className="sr-only">ログイン</DialogTitle>
                <DialogDescription className="sr-only">
                  Googleアカウントでログイン
                </DialogDescription>
                <LoginForm />
              </DialogContent>
            </Dialog>
            <div className="border-l pl-4 h-6 flex items-center">
              <AnimatedThemeToggler className="p-2 hover:bg-accent rounded-full transition-colors" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/10" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="container mx-auto px-4 py-24 md:py-32 lg:py-40">
            <div className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <IconSparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  シンプルに使える
                </span>
              </div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                固定費と
                <br />
                <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  分割払いを管理
                </span>
              </h1>

              <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
                固定費や分割払いを一元管理。支払いスケジュールの把握、月ごとの支出確認がカンタンに。
                もう支払い忘れの心配はありません。
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" className="gap-2 text-base px-8">
                      今すぐ始める
                      <IconArrowRight className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[450px] p-0 border-none bg-transparent shadow-none">
                    <DialogTitle className="sr-only">ログイン</DialogTitle>
                    <DialogDescription className="sr-only">
                      Googleアカウントでログイン
                    </DialogDescription>
                    <LoginForm />
                  </DialogContent>
                </Dialog>
                <a href="#features">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-base px-8"
                  >
                    詳しく見る
                  </Button>
                </a>
              </div>

              <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <IconCheck className="h-4 w-4 text-primary" />
                  <span>Googleログイン対応</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconCheck className="h-4 w-4 text-primary" />
                  <span>登録30秒</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconCheck className="h-4 w-4 text-primary" />
                  <span>シンプル操作</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 md:py-32 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
                シンプルで
                <span className="text-primary">パワフル</span>
                な機能
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                固定費や分割払いの管理に必要な機能をすべて備えています。
                直感的な操作で、誰でもカンタンに使えます。
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, _index) => (
                <Card
                  key={feature.title}
                  className="group relative overflow-hidden border-0 bg-card/50 backdrop-blur transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
                使い方は<span className="text-primary">かんたん</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                3ステップで固定費・分割払い管理を始められます
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
              {[
                {
                  step: "01",
                  title: "Googleでログイン",
                  description: "Googleアカウントで30秒で登録完了",
                },
                {
                  step: "02",
                  title: "支払い情報を登録",
                  description: "固定費や分割払いの詳細を入力するだけ",
                },
                {
                  step: "03",
                  title: "管理スタート",
                  description: "すべての支払いを一元管理",
                },
              ].map((item, index) => (
                <div key={item.step} className="relative text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-6">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-primary/30" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 md:py-32 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary to-primary/80 p-12 md:p-16 text-center">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-100" />
              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-primary-foreground mb-4">
                  今すぐ始めよう
                </h2>
                <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-8">
                  Googleアカウントですぐに始められます。
                  固定費・分割払い管理の新しいスタンダードを体験してください。
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="gap-2 text-base px-8"
                    >
                      はじめる
                      <IconArrowRight className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[450px] p-0 border-none bg-transparent shadow-none">
                    <DialogTitle className="sr-only">ログイン</DialogTitle>
                    <DialogDescription className="sr-only">
                      Googleアカウントでログイン
                    </DialogDescription>
                    <LoginForm />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <IconSparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl tracking-tighter">
                bunkatsu
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 bunkatsu. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
