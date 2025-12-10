# uniam-api

Cloudflare Workers API powered by [Hono](https://hono.dev/).

## セットアップ

```bash
pnpm install
```

## 開発

```bash
# ローカル開発サーバー起動
pnpm dev
```

http://localhost:8787 でアクセス可能。

## テスト

```bash
# テスト実行
pnpm test

# ウォッチモード
pnpm test:watch
```

Vitest + Cloudflare Workers Pool を使用。`src/__tests__/` 配下にテストファイルを配置。

## Lint / フォーマット

[Biome](https://biomejs.dev/) を使用してコードの品質を管理しています。

```bash
# Lintチェック
pnpm lint

# フォーマット
pnpm format

# Lint + フォーマット一括実行
pnpm check
```

### コミット時の自動フォーマット

[Lefthook](https://github.com/evilmartians/lefthook) により、コミット時に自動でフォーマットとLintが実行されます。

初回セットアップ時は `pnpm install` で自動的にフックがインストールされます。手動でインストールする場合:

```bash
pnpm exec lefthook install
```

## デプロイ

```bash
pnpm deploy
```

### 自動デプロイ

`main` ブランチへのマージで Cloudflare により自動デプロイされます。

GitHub Actions では `main` ブランチへの PR 作成時にテストが実行されます。

## 型生成

`wrangler.jsonc` を変更した後、型定義を再生成:

```bash
pnpm cf-typegen
```

## アーキテクチャ

```
src/
├── index.ts           # エントリーポイント（Honoアプリ定義）
└── __tests__/
    └── index.test.ts  # テストファイル
```

### ミドルウェア

- **logger**: リクエスト/レスポンスのログ出力
- **cors**: CORSヘッダー自動付与

### Cloudflare Bindings

環境変数やKV、D1等のバインディングは `c.env` 経由でアクセス:

```ts
const app = new Hono<{ Bindings: CloudflareBindings }>()

app.get('/example', (c) => {
  const value = c.env.MY_VAR
  return c.json({ value })
})
```

## 利用可能なバインディング（wrangler.jsonc）

| バインディング | 用途 |
|---|---|
| `vars` | 環境変数 |
| `kv_namespaces` | KV ストア |
| `d1_databases` | D1 データベース |
| `r2_buckets` | R2 オブジェクトストレージ |
| `ai` | Workers AI |
