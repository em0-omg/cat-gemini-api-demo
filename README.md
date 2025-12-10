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

## デプロイ

```bash
pnpm deploy
```

### GitHub Actions による自動デプロイ

`main` ブランチへの push で自動的にテスト実行 → デプロイされます。

#### 必要な設定

GitHub リポジトリの Settings > Secrets and variables > Actions に以下を追加:

- `CLOUDFLARE_API_TOKEN`: Cloudflare API トークン

トークンの作成方法は [こちら](https://zenn.dev/slowhand/articles/661b3e22b639ce) を参照。

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
