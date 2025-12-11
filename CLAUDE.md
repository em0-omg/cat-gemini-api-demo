# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Workers API project using the Hono web framework. The API is deployed to Cloudflare's edge network.

## Commands

```bash
# Install dependencies
pnpm install

# Start local development server
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Deploy to Cloudflare Workers
pnpm deploy

# Generate/sync TypeScript types from wrangler config
pnpm cf-typegen

# Lint check
pnpm lint

# Format code
pnpm format

# Lint + Format (recommended)
pnpm check
```

## Architecture

- **Runtime**: Cloudflare Workers (edge computing)
- **Framework**: Hono - lightweight web framework for edge
- **AI Integration**: Google Gemini API (`@google/genai`)
- **Testing**: Vitest + @cloudflare/vitest-pool-workers
- **Linter/Formatter**: Biome
- **Git Hooks**: Lefthook (pre-commit: auto format & lint)
- **CI/CD**: GitHub Actions (test on PR to main), Cloudflare auto-deploy
- **Entry Point**: `src/index.ts`
- **Config**: `wrangler.jsonc` - Cloudflare Workers configuration

## Project Structure

```
src/
├── index.ts                    # Main app with Hono routes and middleware
├── types/
│   └── cat.ts                  # Cat data TypeScript interfaces
├── services/
│   └── gemini.ts               # Gemini API service wrapper
├── routes/
│   └── diagnosis.ts            # Cat diagnosis route handler
├── prompts/
│   └── cat-diagnosis.ts        # uniam商品提案プロンプト + JSON Schema
└── __tests__/
    ├── index.test.ts           # API tests using Cloudflare test environment
    └── diagnosis.test.ts       # Diagnosis endpoint tests
.github/
└── workflows/
    └── deploy.yml              # CI/CD workflow
```

## TypeScript Configuration

When using Cloudflare bindings (KV, D1, R2, etc.), pass `CloudflareBindings` as a generic to Hono:

```ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

Run `pnpm cf-typegen` after modifying `wrangler.jsonc` to regenerate types.

## Middleware

The app uses the following middleware:

- `logger()` - Logs all requests/responses to console
- `cors()` - Adds CORS headers for cross-origin requests

## Testing

Tests run in a simulated Cloudflare Workers environment using `@cloudflare/vitest-pool-workers`.

```ts
// Example test
import { env } from 'cloudflare:test'
import app from '../index'

it('GET / returns 200', async () => {
  const res = await app.request('/', {}, env)
  expect(res.status).toBe(200)
})
```

## CI/CD

GitHub Actions workflow (`.github/workflows/deploy.yml`):
1. Runs on pull request to `main` branch
2. Executes tests

Deployment is handled automatically by Cloudflare on merge to `main`.

## API Endpoints

### GET /

Health check endpoint.

### POST /api/diagnosis

uniam商品提案エンドポイント。猫のプロフィールに基づいて最適なuniam商品を最大3つ提案します。
Gemini APIの構造化出力（JSON Schema）を使用して、一貫したレスポンス形式を保証します。

**Request Body:**
```json
{
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
}
```

**Response:**
```json
{
  "summary": "猫の特徴と食事選びのポイントのサマリ",
  "recommendations": [
    {
      "name": "スムースチキン＆サーモン",
      "category": "主食",
      "series": "冷凍フレッシュフード",
      "reason": "チキンが好きなみーちゃんに最適な総合栄養食です。",
      "features": ["鶏もも肉・サーモン使用", "AAFCO基準準拠", "国産食材を低温調理"]
    }
  ],
  "notes": "この提案は一般的な情報提供を目的としています。具体的な健康上の問題がある場合は、獣医師にご相談ください。",
  "generatedAt": "2025-12-12T10:30:00.000Z"
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key (required for diagnosis endpoint) |

### Local Development

Create `.dev.vars` file:
```
GEMINI_API_KEY=your-api-key-here
```

### Production

Set secret via wrangler:
```bash
pnpm wrangler secret put GEMINI_API_KEY
```
