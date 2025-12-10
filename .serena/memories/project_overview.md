# Project Overview

## Purpose
uniam-api is a backend API service deployed on Cloudflare Workers edge network.

## Tech Stack
- **Runtime**: Cloudflare Workers (edge computing)
- **Framework**: Hono v4.x - lightweight web framework optimized for edge environments
- **Language**: TypeScript (ESNext, strict mode)
- **Package Manager**: pnpm
- **Build/Deploy Tool**: Wrangler v4.x
- **Testing**: Vitest + @cloudflare/vitest-pool-workers
- **CI/CD**: GitHub Actions

## Project Structure
```
uniam-api/
├── src/
│   ├── index.ts           # Main entry point, Hono app definition
│   └── __tests__/
│       └── index.test.ts  # API tests
├── .github/
│   └── workflows/
│       └── deploy.yml     # CI/CD workflow
├── wrangler.jsonc         # Cloudflare Workers configuration
├── vitest.config.ts       # Test configuration
├── package.json
└── tsconfig.json
```

## Entry Point
- `src/index.ts` - Defines the Hono application and route handlers
- The app is exported as the default export for Cloudflare Workers

## Middleware
- `logger()` - Request/response logging
- `cors()` - CORS headers for cross-origin requests

## CI/CD
- GitHub Actions automatically runs tests and deploys on push to `main`
- Requires `CLOUDFLARE_API_TOKEN` secret in GitHub repository settings
