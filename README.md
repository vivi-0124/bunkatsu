# Bunkatsu 💸

固定費と分割払いを直感的に管理・可視化するための Web アプリケーションです。

## 🚀 技術スタック

当プロジェクトは、元々 Next.js で構築されたアプリケーションを **Vue 3 + 独立した Hono サーバー** にリファクタリングして構築されています。

### フロントエンド (Frontend)
- **Framework**: Vue 3 (Composition API) + Vite
- **UI Library**: Vuetify 3
- **State Management**: Pinia
- **Routing**: Vue Router
- **Architecture**: Package by Feature（機能別ディレクトリ構成）

### バックエンド (Backend)
- **Framework**: Hono (`@hono/node-server` を用いた独立稼働)
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth

### テスト (Testing)
- **Test Runner**: Vitest
- **Mocking**: MSW (Mock Service Worker)
- **DOM Testing**: `@vue/test-utils` + `jsdom`

---

## 📁 プロジェクト構造 (Package by Feature)

フロントエンドのコードは `src/` 配下にあり、機能（ドメイン）ごとに分割されています。

```text
src/
 ├── app/                  # エントリーポイント (App.vue, main.ts, router)
 ├── shared/               # アプリ全体で共有するコンポーネント、コンポーザブル、MSW設定
 └── features/             # 各機能ごとのモジュール
      ├── auth/            # 認証関連 (stores)
      ├── home/            # ランディングページ
      ├── dashboard/       # ダッシュボード共通レイアウト
      ├── fixed-costs/     # 固定費管理ページ
      ├── monthly-records/ # 月次明細管理ページ・ダイアログ
      └── admin/           # 管理者画面・ユーザー管理ページ
```

---

## 🛠️ 開発環境のセットアップ

### 1. 依存関係のインストール
当プロジェクトはパッケージマネージャーに `pnpm` を推奨しています（npmでも可）。
```bash
pnpm install
```

### 2. 環境変数の設定
プロジェクトルートに `.env` ファイルを作成し、必要な環境変数（データベースURLやBetter Authの設定など）を記述してください。

### 3. アプリケーションの起動
フロントエンドとバックエンド（API）は別々のポートで動作します。ターミナルを2つ開いて実行してください。

**ターミナル1: バックエンド (Hono サーバー)**
```bash
npm run dev:server
# ポート 3001 で Hono サーバーが起動します
```

**ターミナル2: フロントエンド (Vite サーバー)**
```bash
npm run dev
# Vite の開発サーバーが起動し、/api へのリクエストは自動的にポート 3001 へプロキシされます
```

---

## 🧪 テストの実行

フロントエンドのコンポーネントテスト（MSWモックを利用）および、バックエンドの API テストが含まれています。

```bash
# 全てのテストを1度だけ実行
npm run test

# ファイル変更を監視してテストを実行
npm run test:watch

# ブラウザ上でリッチな UI を使って結果を確認
npm run test:ui
```

---

## 📦 ビルドと型チェック

本番環境向けのビルド、および TypeScript の型チェックを行うコマンドです。

```bash
# 型チェックのみ
npm run typecheck

# フロントエンドのビルド
npm run build
```
