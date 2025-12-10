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
```

## Architecture

- **Runtime**: Cloudflare Workers (edge computing)
- **Framework**: Hono - lightweight web framework for edge
- **Testing**: Vitest + @cloudflare/vitest-pool-workers
- **CI/CD**: GitHub Actions (test → deploy on main branch push)
- **Entry Point**: `src/index.ts`
- **Config**: `wrangler.jsonc` - Cloudflare Workers configuration

## Project Structure

```
src/
├── index.ts           # Main app with Hono routes and middleware
└── __tests__/
    └── index.test.ts  # API tests using Cloudflare test environment
.github/
└── workflows/
    └── deploy.yml     # CI/CD workflow
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
1. Runs on push to `main` branch
2. Executes tests
3. Deploys to Cloudflare Workers (requires `CLOUDFLARE_API_TOKEN` secret)
