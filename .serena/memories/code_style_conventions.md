# Code Style and Conventions

## TypeScript
- Target: ESNext
- Module: ESNext with Bundler resolution
- Strict mode enabled
- JSX: react-jsx with hono/jsx as the import source

## Hono Framework Patterns

### Using Cloudflare Bindings
When using Cloudflare bindings (KV, D1, R2, AI, etc.), pass CloudflareBindings as generic:
```typescript
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

### Route Handler Pattern
```typescript
app.get('/path', (c) => {
  return c.text('response')
  // or c.json({ data })
  // or c.html(<Component />)
})
```

### Context Object
- `c.text()` - Return plain text
- `c.json()` - Return JSON response
- `c.html()` - Return HTML (with JSX support)
- `c.env` - Access Cloudflare bindings
- `c.req` - Request object

## File Naming
- Use kebab-case or camelCase for file names
- Entry point is always `index.ts`
