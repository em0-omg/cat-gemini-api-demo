import { GoogleGenAI } from '@google/genai';

export class GeminiService {
	private ai: GoogleGenAI;
	private model = 'gemini-2.5-flash';

	constructor(apiKey: string) {
		this.ai = new GoogleGenAI({ apiKey });
	}

	async generateContent(prompt: string): Promise<string> {
		const response = await this.ai.models.generateContent({
			model: this.model,
			contents: prompt,
			config: {
				maxOutputTokens: 2048,
				temperature: 0.7,
			},
		});

		if (!response.text) {
			throw new Error('Gemini API returned empty response');
		}

		return response.text;
	}

	async generateStructuredContent<T>(prompt: string, schema: object): Promise<T> {
		const response = await this.ai.models.generateContent({
			model: this.model,
			contents: prompt,
			config: {
				responseMimeType: 'application/json',
				responseJsonSchema: schema,
				maxOutputTokens: 2048,
				temperature: 0.7,
			},
		});

		if (!response.text) {
			throw new Error('Gemini API returned empty response');
		}

		return JSON.parse(response.text) as T;
	}
}
