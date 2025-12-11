import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../index';
import type { CatInfo, DiagnosisResponse, ErrorResponse } from '../types/cat';

// Mock the @google/genai module
vi.mock('@google/genai', () => ({
	GoogleGenAI: vi.fn().mockImplementation(() => ({
		models: {
			generateContent: vi.fn().mockResolvedValue({
				text: 'これはテスト診断結果です。みーちゃんは健康的な猫ちゃんです。',
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

	it('should return 200 with diagnosis for valid cat data', async () => {
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
		const json = (await res.json()) as DiagnosisResponse;
		expect(json).toHaveProperty('diagnosis');
		expect(json).toHaveProperty('generatedAt');
		expect(json.diagnosis).toContain('みーちゃん');
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
		const json = (await res.json()) as DiagnosisResponse;
		expect(json).toHaveProperty('diagnosis');
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
		const json = (await res.json()) as DiagnosisResponse;
		expect(json).toHaveProperty('diagnosis');
	});
});
