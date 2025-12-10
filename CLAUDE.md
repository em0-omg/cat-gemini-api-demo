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

# Deploy to Cloudflare Workers
pnpm deploy

# Generate/sync TypeScript types from wrangler config
pnpm cf-typegen
```

## Architecture

- **Runtime**: Cloudflare Workers (edge computing)
- **Framework**: Hono - lightweight web framework for edge
- **Entry Point**: `src/index.ts`
- **Config**: `wrangler.jsonc` - Cloudflare Workers configuration

## TypeScript Configuration

When using Cloudflare bindings (KV, D1, R2, etc.), pass `CloudflareBindings` as a generic to Hono:

```ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

Run `pnpm cf-typegen` after modifying `wrangler.jsonc` to regenerate types.
