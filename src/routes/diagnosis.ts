import { Hono } from 'hono';
import { buildCatRecommendationPrompt, recommendationSchema } from '../prompts/cat-diagnosis';
import { GeminiService } from '../services/gemini';
import type {
	CatInfo,
	ErrorResponse,
	RecommendationResponse,
	RecommendationResult,
} from '../types/cat';
import { logGeminiError } from '../utils/error-logger';

const diagnosis = new Hono<{ Bindings: CloudflareBindings }>();

// リクエストボディのバリデーション
function validateCatInfo(cat: unknown): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!cat || typeof cat !== 'object') {
		return { valid: false, errors: ['cat object is required'] };
	}

	const catObj = cat as Record<string, unknown>;

	// 必須フィールドのチェック
	const requiredFields = [
		'name',
		'gender',
		'age',
		'breed',
		'bodyType',
		'weight',
		'activityLevel',
		'mainFood',
		'treats',
		'favoriteFood',
		'dislikedFood',
		'healthConcerns',
	];

	for (const field of requiredFields) {
		if (catObj[field] === undefined || catObj[field] === null) {
			errors.push(`${field} is required`);
		}
	}

	// 型チェック
	if (typeof catObj.name !== 'string') errors.push('name must be a string');
	if (typeof catObj.gender !== 'string') errors.push('gender must be a string');
	if (typeof catObj.age !== 'number' || Number.isNaN(catObj.age))
		errors.push('age must be a number');
	if (typeof catObj.weight !== 'number' || Number.isNaN(catObj.weight))
		errors.push('weight must be a number');
	if (typeof catObj.neutered !== 'boolean') errors.push('neutered must be a boolean');

	// dislikedFoodのチェック
	if (catObj.dislikedFood && typeof catObj.dislikedFood === 'object') {
		const df = catObj.dislikedFood as Record<string, unknown>;
		if (!df.status) errors.push('dislikedFood.status is required');
	} else {
		errors.push('dislikedFood must be an object');
	}

	// healthConcernsのチェック
	if (catObj.healthConcerns && typeof catObj.healthConcerns === 'object') {
		const hc = catObj.healthConcerns as Record<string, unknown>;
		if (typeof hc.hasIssues !== 'boolean')
			errors.push('healthConcerns.hasIssues must be a boolean');
	} else {
		errors.push('healthConcerns must be an object');
	}

	return { valid: errors.length === 0, errors };
}

diagnosis.post('/', async (c) => {
	const requestId = crypto.randomUUID().slice(0, 8);
	console.log(`[${requestId}] POST /api/diagnosis - Start`);

	try {
		// リクエストボディの取得
		let body: { cat: CatInfo };
		try {
			body = await c.req.json<{ cat: CatInfo }>();
			console.log(`[${requestId}] Request body parsed successfully`);
		} catch (parseError) {
			console.error(`[${requestId}] JSON parse error:`, parseError);
			return c.json<ErrorResponse>(
				{
					error: 'Bad Request',
					message: 'リクエストボディのJSONパースに失敗しました',
					details: parseError instanceof Error ? parseError.message : 'Unknown parse error',
				} as ErrorResponse & { details: string },
				400,
			);
		}

		// catオブジェクトの存在チェック
		if (!body.cat) {
			console.error(`[${requestId}] Missing cat object in request body`);
			return c.json<ErrorResponse>(
				{
					error: 'Bad Request',
					message: '猫の情報が必要です',
					details: 'Request body must contain a "cat" object',
				} as ErrorResponse & { details: string },
				400,
			);
		}

		// バリデーション
		const validation = validateCatInfo(body.cat);
		if (!validation.valid) {
			console.error(`[${requestId}] Validation errors:`, validation.errors);
			return c.json<ErrorResponse>(
				{
					error: 'Bad Request',
					message: 'リクエストデータが不正です',
					details: validation.errors.join(', '),
				} as ErrorResponse & { details: string },
				400,
			);
		}

		console.log(`[${requestId}] Validation passed, calling Gemini API`);
		const geminiStartTime = Date.now();

		// Gemini API呼び出し with timeout and retry (設定は環境変数から取得)
		const geminiService = new GeminiService(c.env.GEMINI_API_KEY, {
			timeoutMs: Number(c.env.GEMINI_TIMEOUT_MS) || 15000,
			maxRetries: Number(c.env.GEMINI_MAX_RETRIES) || 3,
			retryDelayMs: Number(c.env.GEMINI_RETRY_DELAY_MS) || 1000,
		});
		const prompt = buildCatRecommendationPrompt(body.cat);

		let result: RecommendationResult;
		try {
			result = await geminiService.generateStructuredContent<RecommendationResult>(
				prompt,
				recommendationSchema,
			);
			const geminiDurationMs = Date.now() - geminiStartTime;
			console.log(`[${requestId}] Gemini API response received in ${geminiDurationMs}ms`);
		} catch (geminiError) {
			const geminiDurationMs = Date.now() - geminiStartTime;

			// Log structured error with classification
			const errorDetails = logGeminiError(geminiError, {
				requestId,
				operation: 'Gemini API call',
				timestamp: new Date().toISOString(),
				durationMs: geminiDurationMs,
			});

			// Determine appropriate HTTP status code and message based on error type
			let statusCode = 503; // Default: Service Unavailable
			let userMessage = 'AI診断サービスでエラーが発生しました';

			switch (errorDetails.errorType) {
				case 'TimeoutError':
					statusCode = 504; // Gateway Timeout
					userMessage =
						'AI診断サービスの応答がタイムアウトしました。しばらく待ってから再度お試しください。';
					break;
				case 'RateLimitError':
					statusCode = 429; // Too Many Requests
					userMessage = 'リクエストが集中しています。しばらく待ってから再度お試しください。';
					break;
				case 'AuthenticationError':
					statusCode = 500; // Internal Server Error (don't expose auth issues to users)
					userMessage = 'サービス設定エラーが発生しました。管理者にお問い合わせください。';
					break;
				case 'ValidationError':
				case 'ParseError':
					statusCode = 400; // Bad Request
					userMessage = 'リクエスト内容の処理に失敗しました';
					break;
			}

			return c.json<ErrorResponse>(
				{
					error: errorDetails.errorType,
					message: userMessage,
					details: errorDetails.errorMessage,
				} as ErrorResponse & { details: string },
				statusCode,
			);
		}

		console.log(`[${requestId}] Success`);
		return c.json<RecommendationResponse>({
			...result,
			generatedAt: new Date().toISOString(),
		});
	} catch (error) {
		console.error(`[${requestId}] Unexpected error:`, error);

		if (error instanceof SyntaxError) {
			return c.json<ErrorResponse>(
				{
					error: 'Bad Request',
					message: 'Invalid JSON format',
					details: error.message,
				} as ErrorResponse & { details: string },
				400,
			);
		}

		return c.json<ErrorResponse>(
			{
				error: 'Internal Server Error',
				message: '診断の処理中にエラーが発生しました',
				details: error instanceof Error ? error.message : 'Unknown error',
			} as ErrorResponse & { details: string },
			500,
		);
	}
});

export default diagnosis;
