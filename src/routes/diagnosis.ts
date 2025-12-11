import { Hono } from 'hono';
import { buildCatRecommendationPrompt, recommendationSchema } from '../prompts/cat-diagnosis';
import { GeminiService } from '../services/gemini';
import type {
	CatInfo,
	ErrorResponse,
	RecommendationResponse,
	RecommendationResult,
} from '../types/cat';

const diagnosis = new Hono<{ Bindings: CloudflareBindings }>();

diagnosis.post('/', async (c) => {
	try {
		const body = await c.req.json<{ cat: CatInfo }>();

		if (!body.cat) {
			return c.json<ErrorResponse>({ error: 'Bad Request', message: '猫の情報が必要です' }, 400);
		}

		const geminiService = new GeminiService(c.env.GEMINI_API_KEY);
		const prompt = buildCatRecommendationPrompt(body.cat);
		const result = await geminiService.generateStructuredContent<RecommendationResult>(
			prompt,
			recommendationSchema,
		);

		return c.json<RecommendationResponse>({
			...result,
			generatedAt: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Diagnosis error:', error);

		if (error instanceof SyntaxError) {
			return c.json<ErrorResponse>({ error: 'Bad Request', message: 'Invalid JSON format' }, 400);
		}

		return c.json<ErrorResponse>(
			{
				error: 'Internal Server Error',
				message: '診断の処理中にエラーが発生しました',
			},
			500,
		);
	}
});

export default diagnosis;
