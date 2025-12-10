# Project Overview

## Purpose
uniam-api is a backend API service deployed on Cloudflare Workers edge network.

## Tech Stack
- **Runtime**: Cloudflare Workers (edge computing)
- **Framework**: Hono v4.x - lightweight web framework optimized for edge environments
- **Language**: TypeScript (ESNext, strict mode)
- **Package Manager**: pnpm
- **Build/Deploy Tool**: Wrangler v4.x

## Project Structure
```
uniam-api/
├── src/
│   └── index.ts      # Main entry point, Hono app definition
├── wrangler.jsonc    # Cloudflare Workers configuration
├── package.json
└── tsconfig.json
```

## Entry Point
- `src/index.ts` - Defines the Hono application and route handlers
- The app is exported as the default export for Cloudflare Workers
