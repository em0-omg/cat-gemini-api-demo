# uniam-api

Cloudflare Workers API powered by [Hono](https://hono.dev/).

猫のプロフィールに基づいて最適なuniam商品を提案するAPIです。Google Gemini APIの構造化出力機能を使用して、一貫したJSON形式でおすすめ商品を最大3つ提案します。

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
│   └── cat-diagnosis.ts        # uniam商品提案プロンプト + JSON Schema
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

猫のプロフィールに基づいてuniam商品を提案するエンドポイント。

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
  "summary": "みーちゃんは3歳のスコティッシュフォールドで、普通体型・普通の活動量です。チキンが好きで、特に健康上の問題はありません。毎日の主食としてバランスの良いフードと、ときどきのおやつで楽しみを提供することをおすすめします。",
  "recommendations": [
    {
      "name": "スムースチキン＆サーモン",
      "category": "主食",
      "series": "冷凍フレッシュフード",
      "reason": "チキンが好きなみーちゃんに最適な総合栄養食です。鶏もも肉とサーモンを使用し、AAFCO基準準拠で栄養バランスも万全です。",
      "features": ["鶏もも肉・サーモン使用", "AAFCO基準準拠", "国産食材を低温調理"]
    },
    {
      "name": "平飼いチキン＆緑イ貝",
      "category": "主食",
      "series": "WiLD PRO ドライフード",
      "reason": "NZ産平飼いチキンを使用したグレインフリーのドライフード。ウェットフードと併用することで食事のバリエーションが広がります。",
      "features": ["グレインフリー", "免疫サポート", "スチーム製法"]
    },
    {
      "name": "デンタルケア",
      "category": "おやつ",
      "series": "ピュアピューレ",
      "reason": "チキン＆ホタテ味で、みーちゃんの好みに合います。口内環境ケアもできる機能性おやつです。",
      "features": ["チキン＆ホタテ味", "口内環境ケア", "獣医師開発"]
    }
  ],
  "notes": "この提案は一般的な情報提供を目的としています。具体的な健康上の問題がある場合は、獣医師にご相談ください。",
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

### レスポンスフィールド

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `summary` | string | 猫の特徴と食事選びのポイントのサマリ |
| `recommendations` | array | 推奨商品リスト（最大3つ） |
| `recommendations[].name` | string | 商品名 |
| `recommendations[].category` | string | カテゴリ（主食/おやつ/ケアフード） |
| `recommendations[].series` | string | シリーズ名 |
| `recommendations[].reason` | string | この猫に推奨する理由 |
| `recommendations[].features` | string[] | 商品の特徴（2-3項目） |
| `notes` | string | 注意事項・免責 |
| `generatedAt` | string | 生成日時（ISO 8601形式） |
