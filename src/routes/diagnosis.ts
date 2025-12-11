import { Hono } from 'hono';
import { buildCatDiagnosisPrompt } from '../prompts/cat-diagnosis';
import { GeminiService } from '../services/gemini';
import type { CatInfo, DiagnosisResponse, ErrorResponse } from '../types/cat';

const diagnosis = new Hono<{ Bindings: CloudflareBindings }>();

diagnosis.post('/', async (c) => {
	try {
		const body = await c.req.json<{ cat: CatInfo }>();

		if (!body.cat) {
			return c.json<ErrorResponse>({ error: 'Bad Request', message: '猫の情報が必要です' }, 400);
		}

		const geminiService = new GeminiService(c.env.GEMINI_API_KEY);
		const prompt = buildCatDiagnosisPrompt(body.cat);
		const diagnosisResult = await geminiService.generateContent(prompt);

		return c.json<DiagnosisResponse>({
			diagnosis: diagnosisResult,
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
