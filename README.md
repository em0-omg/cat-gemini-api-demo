# uniam-api

Cloudflare Workers API powered by [Hono](https://hono.dev/).

猫の健康診断アドバイスを提供するAPIです。Google Gemini APIを使用して、猫の情報に基づいた健康アドバイスを生成します。

## セットアップ

```bash
pnpm install
```

### 環境変数の設定

ローカル開発用に `.dev.vars` ファイルを作成:

```
GEMINI_API_KEY=your-gemini-api-key-here
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
├── index.ts                    # エントリーポイント（Honoアプリ定義）
├── types/
│   └── cat.ts                  # 猫データの型定義
├── services/
│   └── gemini.ts               # Gemini APIサービス
├── routes/
│   └── diagnosis.ts            # 診断エンドポイント
├── prompts/
│   └── cat-diagnosis.ts        # プロンプトテンプレート
└── __tests__/
    ├── index.test.ts           # 基本テスト
    └── diagnosis.test.ts       # 診断エンドポイントテスト
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

## APIエンドポイント

### GET /

ヘルスチェック用エンドポイント。

### POST /api/diagnosis

猫の健康診断アドバイスを取得するエンドポイント。

**リクエスト例:**

```bash
curl -X POST http://localhost:8787/api/diagnosis \
  -H "Content-Type: application/json" \
  -d '{
    "cat": {
      "name": "みーちゃん",
      "gender": "メス",
      "neutered": true,
      "age": 3,
      "breed": "スコティッシュフォールド",
      "bodyType": "普通",
      "weight": 4.2,
      "activityLevel": "普通",
      "mainFood": "ドライフード",
      "treats": "ときどき",
      "favoriteFood": "チキン",
      "dislikedFood": { "status": "ない" },
      "healthConcerns": { "hasIssues": false }
    }
  }'
```

**レスポンス例:**

```json
{
  "diagnosis": "## 総合評価\n\nみーちゃんは...",
  "generatedAt": "2025-12-12T10:30:00.000Z"
}
```

### 猫情報のフィールド

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `name` | string | 猫の名前 |
| `gender` | "オス" \| "メス" | 性別 |
| `neutered` | boolean | 去勢済みか |
| `age` | number | 年齢（歳） |
| `breed` | string | 猫種 |
| `bodyType` | string | 体型（痩せすぎ/ちょい痩せ/普通/ちょいおデブ/おデブちゃん） |
| `weight` | number | 体重（kg） |
| `activityLevel` | string | 活動量（ずっと寝てる/普通/よく飛ぶ） |
| `mainFood` | string | 主食（ドライフード/ウェットフード/その他） |
| `treats` | string | おやつ頻度（ときどき/毎日/全くあげない） |
| `favoriteFood` | string | 好きな食べ物（チキン/ビーフ/お魚/なんでも好き） |
| `dislikedFood` | object | 苦手な食べ物 `{ status: "ない" \| "わからない" \| "ある", details?: string[] }` |
| `healthConcerns` | object | 健康上のお悩み `{ hasIssues: boolean, concerns?: string[] }` |

### 健康上のお悩み選択肢

食べ過ぎ、少食、偏食・食べムラ、食物アレルギー、その他のお悩み、肥満、吐き戻し、下部尿路疾患、痩身、歯、腎臓疾患、嘔吐、便秘、涙やけ、肝臓疾患、下痢、関節、糖尿、皮膚
