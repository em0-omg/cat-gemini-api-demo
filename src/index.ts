import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import diagnosis from './routes/diagnosis';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Middleware
app.use('*', logger());
app.use('*', secureHeaders());

// CORS: 環境変数で許可オリジンを制御
app.use('/api/*', async (c, next) => {
	const allowedOrigins = c.env.ALLOWED_ORIGINS
		? c.env.ALLOWED_ORIGINS.split(',')
		: ['http://localhost:8787'];

	const corsMiddleware = cors({
		origin: allowedOrigins,
		allowMethods: ['POST', 'OPTIONS'],
		allowHeaders: ['Content-Type'],
		maxAge: 86400,
	});
	return corsMiddleware(c, next);
});

// Body Limit: 10KB（DoS対策）
app.use(
	'/api/*',
	bodyLimit({
		maxSize: 10 * 1024,
		onError: (c) => c.json({ error: 'Payload Too Large' }, 413),
	}),
);

// Routes
app.get('/', (c) => {
	return c.text('Hello Hono! from Cloudflare Workers');
});

app.route('/api/diagnosis', diagnosis);

export default app;
