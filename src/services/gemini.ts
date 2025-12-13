import { GoogleGenAI } from '@google/genai';
import { withRetry } from '../utils/retry';
import { TimeoutError, withTimeout } from '../utils/timeout';

export interface GeminiServiceOptions {
	/** Timeout in milliseconds (default: 15000) */
	timeoutMs?: number;
	/** Maximum retry attempts (default: 3) */
	maxRetries?: number;
	/** Initial retry delay in milliseconds (default: 1000) */
	retryDelayMs?: number;
}

// Re-export TimeoutError for use in error handling
export { TimeoutError };

export class GeminiService {
	private ai: GoogleGenAI;
	private model = 'gemini-2.5-flash';
	private options: Required<GeminiServiceOptions>;

	constructor(apiKey: string, options: GeminiServiceOptions = {}) {
		this.ai = new GoogleGenAI({ apiKey });
		this.options = {
			timeoutMs: options.timeoutMs ?? 15000,
			maxRetries: options.maxRetries ?? 3,
			retryDelayMs: options.retryDelayMs ?? 1000,
		};
	}

	async generateContent(prompt: string): Promise<string> {
		const startTime = Date.now();

		try {
			const result = await withRetry(
				() =>
					withTimeout(
						this.ai.models.generateContent({
							model: this.model,
							contents: prompt,
							config: {
								maxOutputTokens: 2048,
								temperature: 0.7,
							},
						}),
						this.options.timeoutMs,
						`Gemini API call timed out after ${this.options.timeoutMs}ms`,
					),
				{
					maxAttempts: this.options.maxRetries,
					initialDelayMs: this.options.retryDelayMs,
				},
			);

			const durationMs = Date.now() - startTime;
			console.log(`[GeminiService] generateContent completed in ${durationMs}ms`);

			if (!result.text) {
				throw new Error('Gemini API returned empty response');
			}

			return result.text;
		} catch (error) {
			const durationMs = Date.now() - startTime;

			// Enrich timeout error with duration info
			if (error instanceof TimeoutError) {
				throw new Error(
					`Gemini API timeout after ${durationMs}ms (limit: ${this.options.timeoutMs}ms)`,
				);
			}

			throw error;
		}
	}

	async generateStructuredContent<T>(prompt: string, schema: object): Promise<T> {
		const startTime = Date.now();

		try {
			const result = await withRetry(
				() =>
					withTimeout(
						this.ai.models.generateContent({
							model: this.model,
							contents: prompt,
							config: {
								responseMimeType: 'application/json',
								responseJsonSchema: schema,
								maxOutputTokens: 2048,
								temperature: 0.7,
							},
						}),
						this.options.timeoutMs,
						`Gemini API structured call timed out after ${this.options.timeoutMs}ms`,
					),
				{
					maxAttempts: this.options.maxRetries,
					initialDelayMs: this.options.retryDelayMs,
				},
			);

			const durationMs = Date.now() - startTime;
			console.log(`[GeminiService] generateStructuredContent completed in ${durationMs}ms`);

			if (!result.text) {
				throw new Error('Gemini API returned empty response');
			}

			try {
				return JSON.parse(result.text) as T;
			} catch (parseError) {
				throw new Error(
					`Failed to parse Gemini JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`,
				);
			}
		} catch (error) {
			const durationMs = Date.now() - startTime;

			// Enrich timeout error with duration info
			if (error instanceof TimeoutError) {
				throw new Error(
					`Gemini API timeout after ${durationMs}ms (limit: ${this.options.timeoutMs}ms)`,
				);
			}

			throw error;
		}
	}
}
