import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Middleware
app.use("*", logger());
app.use("*", cors());

app.get("/", (c) => {
  return c.text("Hello Hono! from Cloudflare Workers");
});

export default app;
