import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import diagnosis from './routes/diagnosis';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Routes
app.get('/', (c) => {
	return c.text('Hello Hono! from Cloudflare Workers');
});

app.route('/api/diagnosis', diagnosis);

export default app;
