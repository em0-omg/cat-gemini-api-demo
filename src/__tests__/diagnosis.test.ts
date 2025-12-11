import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../index';
import type { CatInfo, ErrorResponse, RecommendationResponse } from '../types/cat';

// Mock response for structured output
const mockRecommendationResult = {
	summary:
		'みーちゃんは3歳のスコティッシュフォールドで、普通体型・普通の活動量です。チキンが好きで、特に健康上の問題はありません。',
	recommendations: [
		{
			name: 'スムースチキン＆サーモン',
			category: '主食',
			series: '冷凍フレッシュフード',
			reason: 'チキンが好きなみーちゃんに最適な総合栄養食です。',
			features: ['鶏もも肉・サーモン使用', 'AAFCO基準準拠', '国産食材を低温調理'],
		},
		{
			name: 'デンタルケア',
			category: 'おやつ',
			series: 'ピュアピューレ',
			reason: 'チキン＆ホタテ味で好みに合います。',
			features: ['チキン＆ホタテ味', '口内環境ケア', '獣医師開発'],
		},
	],
	notes:
		'この提案は一般的な情報提供を目的としています。具体的な健康上の問題がある場合は、獣医師にご相談ください。',
};

// Mock the @google/genai module
vi.mock('@google/genai', () => ({
	GoogleGenAI: vi.fn().mockImplementation(() => ({
		models: {
			generateContent: vi.fn().mockResolvedValue({
				text: JSON.stringify(mockRecommendationResult),
			}),
		},
	})),
}));

const validCatData: CatInfo = {
	name: 'みーちゃん',
	gender: 'メス',
	neutered: true,
	age: 3,
	breed: 'スコティッシュフォールド',
	bodyType: '普通',
	weight: 4.2,
	activityLevel: '普通',
	mainFood: 'ドライフード',
	treats: 'ときどき',
	favoriteFood: 'チキン',
	dislikedFood: {
		status: 'ない',
	},
	healthConcerns: {
		hasIssues: false,
	},
};

describe('POST /api/diagnosis', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return 200 with recommendations for valid cat data', async () => {
		const res = await app.request(
			'/api/diagnosis',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ cat: validCatData }),
			},
			{ ...env, GEMINI_API_KEY: 'test-api-key' },
		);

		expect(res.status).toBe(200);
		const json = (await res.json()) as RecommendationResponse;

		// Check response structure
		expect(json).toHaveProperty('summary');
		expect(json).toHaveProperty('recommendations');
		expect(json).toHaveProperty('notes');
		expect(json).toHaveProperty('generatedAt');

		// Check recommendations array
		expect(Array.isArray(json.recommendations)).toBe(true);
		expect(json.recommendations.length).toBeGreaterThan(0);
		expect(json.recommendations.length).toBeLessThanOrEqual(3);

		// Check each recommendation has required fields
		for (const rec of json.recommendations) {
			expect(rec).toHaveProperty('name');
			expect(rec).toHaveProperty('category');
			expect(rec).toHaveProperty('series');
			expect(rec).toHaveProperty('reason');
			expect(rec).toHaveProperty('features');
			expect(Array.isArray(rec.features)).toBe(true);
		}
	});

	it('should return 400 for missing cat data', async () => {
		const res = await app.request(
			'/api/diagnosis',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			},
			{ ...env, GEMINI_API_KEY: 'test-api-key' },
		);

		expect(res.status).toBe(400);
		const json = (await res.json()) as ErrorResponse;
		expect(json.error).toBe('Bad Request');
		expect(json.message).toBe('猫の情報が必要です');
	});

	it('should return 400 for invalid JSON', async () => {
		const res = await app.request(
			'/api/diagnosis',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: 'invalid json',
			},
			{ ...env, GEMINI_API_KEY: 'test-api-key' },
		);

		expect(res.status).toBe(400);
	});

	it('should handle cat with health concerns', async () => {
		const catWithConcerns: CatInfo = {
			...validCatData,
			healthConcerns: {
				hasIssues: true,
				concerns: ['肥満', '下部尿路疾患'],
			},
		};

		const res = await app.request(
			'/api/diagnosis',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ cat: catWithConcerns }),
			},
			{ ...env, GEMINI_API_KEY: 'test-api-key' },
		);

		expect(res.status).toBe(200);
		const json = (await res.json()) as RecommendationResponse;
		expect(json).toHaveProperty('summary');
		expect(json).toHaveProperty('recommendations');
	});

	it('should handle cat with disliked foods', async () => {
		const catWithDislikedFoods: CatInfo = {
			...validCatData,
			dislikedFood: {
				status: 'ある',
				details: ['鶏肉', 'サーモン'],
			},
		};

		const res = await app.request(
			'/api/diagnosis',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ cat: catWithDislikedFoods }),
			},
			{ ...env, GEMINI_API_KEY: 'test-api-key' },
		);

		expect(res.status).toBe(200);
		const json = (await res.json()) as RecommendationResponse;
		expect(json).toHaveProperty('summary');
		expect(json).toHaveProperty('recommendations');
	});
});
