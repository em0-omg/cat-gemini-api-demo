# Suggested Commands

## Development
```bash
# Install dependencies
pnpm install

# Start local development server (with hot reload)
pnpm dev
```

## Testing
```bash
# Run tests once
pnpm test

# Run tests in watch mode (re-runs on file changes)
pnpm test:watch
```

## Deployment
```bash
# Deploy to Cloudflare Workers (with minification)
pnpm deploy
```

## Type Generation
```bash
# Generate/sync TypeScript types from wrangler.jsonc
# Run this after adding Cloudflare bindings (KV, D1, R2, etc.)
pnpm cf-typegen
```

## System Utilities (macOS/Darwin)
```bash
# Standard Unix commands work on Darwin
ls, cd, grep, find, cat, etc.

# Note: Some GNU options may differ from Linux
# Use `man <command>` to check Darwin-specific options
```
